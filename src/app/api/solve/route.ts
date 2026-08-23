import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { ask, parseQuiz } from "@/lib/ai/claude";
import { EXPLAIN_SYSTEM, QUIZ_SYSTEM } from "@/lib/ai/prompts";
import { one } from "@/lib/db/pool";
import { track } from "@/lib/db/queries/events";
import { rateLimit } from "@/lib/security/ratelimit";
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
  if (!text || String(text).trim().length < 3)
    return NextResponse.json({ ok: false, error: "Savolni yozing" }, { status: 400 });

  // Tushuntirish — kuchli model (bola shuni o'qiydi). Test — tez va arzon model.
  // Ikkalasi PARALLEL ketadi: test tuzish uchun tushuntirish shart emas, savolning o'zi yetadi.
  const question = String(text).slice(0, 2000);
  const [explain, quizRes] = await Promise.allSettled([
    ask(EXPLAIN_SYSTEM, question),
    ask(QUIZ_SYSTEM, `Savol/mavzu: ${question}`, 700, QUIZ_MODEL),
  ]);
  if (explain.status === "rejected")
    return NextResponse.json({ ok: false, error: "AI hozir javob bera olmadi, qayta urining" }, { status: 502 });
  const ex = explain.value;
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
  return NextResponse.json({ ok: true, explanation: ex.text, quizId, questions });
}
