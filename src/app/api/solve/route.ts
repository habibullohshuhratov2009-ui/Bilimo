import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { ask, parseQuiz } from "@/lib/ai/claude";
import { EXPLAIN_SYSTEM, QUIZ_SYSTEM } from "@/lib/ai/prompts";
import { one } from "@/lib/db/pool";
import { track } from "@/lib/db/queries/events";
import { rateLimit } from "@/lib/security/ratelimit";
import { publicQuestions } from "@/lib/ai/sanitize";
import {
  detectInjection,
  leakedCanary,
  normalizeUserText,
  sanitizeAiOutput,
  withCanary,
  wrapUntrusted,
} from "@/lib/ai/guard";
export const maxDuration = 60;

/** Test tuzish — mexanik ish, arzon modelga beriladi (egasi: "aniq bo'lgach pastroq modelga ol"). */
const QUIZ_MODEL = process.env.AI_QUIZ_MODEL ?? "claude-haiku-4-5-20251001";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Kirilmagan" }, { status: 401 });
  // AI chaqiruvi pul turadi: bitta o'quvchi daqiqasiga 6 marta.
  const rl = rateLimit(`solve:${user.id}`, 6, 60_000);
  if (!rl.ok)
    return NextResponse.json(
      { ok: false, error: `Biroz sekinroq — ${rl.retryAfter} soniyadan keyin urinib ko'ring` }, { status: 429 });

  const { text } = await req.json();
  const question = normalizeUserText(text);
  if (question.length < 3)
    return NextResponse.json({ ok: false, error: "Savolni yozing" }, { status: 400 });

  // 1-qatlam: hujum shakllari. Bloklansa — AI ga umuman bormaydi (pul ham tejaladi).
  const threat = detectInjection(question);
  if (threat.blocked) {
    await track(user.id, "injection_blocked", { hits: threat.hits, score: threat.score });
    return NextResponse.json(
      { ok: false, error: "Men faqat dars savollariga yordam beraman. Savolingni oddiy qilib yozib ko'r." },
      { status: 400 });
  }
  if (threat.hits.length) await track(user.id, "injection_suspect", { hits: threat.hits, score: threat.score });

  // Tushuntirish — kuchli model (bola shuni o'qiydi). Test — tez va arzon model.
  // Ikkalasi PARALLEL ketadi: test tuzish uchun tushuntirish shart emas, savolning o'zi yetadi.
  const [explain, quizRes] = await Promise.allSettled([
    ask(withCanary(EXPLAIN_SYSTEM), wrapUntrusted(question), 520),
    ask(withCanary(QUIZ_SYSTEM), wrapUntrusted(question), 700, QUIZ_MODEL),
  ]);
  if (explain.status === "rejected")
    return NextResponse.json({ ok: false, error: "AI hozir javob bera olmadi, qayta urining" }, { status: 502 });
  const ex = explain.value;
  // 4-qatlam: system oshkor bo'lganini tekshirish. Chiqib ketgan bo'lsa — javobni BERMAYMIZ.
  if (leakedCanary(ex.text)) {
    await track(user.id, "canary_leak", { route: "solve" });
    return NextResponse.json(
      { ok: false, error: "Bu savolga javob bera olmayman. Boshqacha yozib ko'r." }, { status: 400 });
  }
  ex.text = sanitizeAiOutput(ex.text);
  // Model ba'zan bo'sh javob qaytaradi (masalan tushunarsiz/base64 matnda) —
  // o'quvchi bo'sh kartani emas, tushunarli xabarni ko'rsin.
  if (!ex.text || ex.text.trim().length < 10)
    return NextResponse.json(
      { ok: false, error: "Savolni tushunmadim. Iltimos, oddiy so'zlar bilan qayta yozib ko'r." },
      { status: 422 });
  const row = await one<{ id: number }>(
    `INSERT INTO explanations (user_id, input_text, output_md, model, input_tokens, out_tokens)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [user.id, question, ex.text, ex.model, ex.inTokens, ex.outTokens]);

  let quizId: number | null = null;
  let questions: unknown[] = [];
  try {
    if (quizRes.status !== "fulfilled") throw new Error("test tuzilmadi");
    questions = parseQuiz(quizRes.value.text);
    const saved = await one<{ id: number }>(
      `INSERT INTO quizzes (source, questions, created_by) VALUES ('solve',$1,$2) RETURNING id`,
      [JSON.stringify({ questions }), user.id]);
    quizId = saved?.id ?? null;
  } catch {
    /* test tuzilmasa ham tushuntirish beriladi */
  }

  await track(user.id, "solve", { explanationId: row?.id, hasQuiz: !!quizId });
  // Diqqat: savollar javob KALITISIZ ketadi.
  return NextResponse.json({ ok: true, explanation: ex.text, quizId, questions: publicQuestions(questions as any[]) });
}
