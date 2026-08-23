import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { one } from "@/lib/db/pool";
import { addCoins, balance } from "@/lib/db/queries/coins";
import { track } from "@/lib/db/queries/events";
import { rateLimit } from "@/lib/security/ratelimit";

const COIN_PER_CORRECT = 5;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Kirilmagan" }, { status: 401 });
  const rl = rateLimit(`submit:${user.id}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Biroz kuting" }, { status: 429 });

  const { quizId, answers, durationMs } = await req.json();

  // Faqat O'ZI yaratgan (solve) testini topshira oladi — begona yoki duel testi emas.
  const quiz = await one<{ questions: any; created_by: number; source: string }>(
    `SELECT questions, created_by, source FROM quizzes WHERE id = $1`, [quizId]);
  if (!quiz || quiz.source !== "solve" || Number(quiz.created_by) !== user.id)
    return NextResponse.json({ ok: false, error: "Test topilmadi" }, { status: 404 });

  const list = quiz.questions?.questions ?? [];
  let correct = 0;
  list.forEach((qq: any, i: number) => { if (Number(answers?.[i]) === Number(qq.correct)) correct++; });

  // Bitta testni faqat BIR MARTA topshirish mumkin (aks holda tanga cheksiz yig'ilardi).
  let attempt: { id: number } | null = null;
  try {
    attempt = await one<{ id: number }>(
      `INSERT INTO attempts (user_id, quiz_id, correct, total, duration_ms) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [user.id, quizId, correct, list.length, durationMs ?? null]);
  } catch (e: any) {
    if (e?.code === "23505")
      return NextResponse.json({ ok: false, error: "Bu test allaqachon topshirilgan" }, { status: 409 });
    throw e;
  }
  const coins = correct * COIN_PER_CORRECT;
  if (coins > 0) await addCoins(user.id, coins, "quiz_correct", attempt?.id);
  await track(user.id, "quiz_submit", { correct, total: list.length });

  // Kalit FAQAT topshirilgandan keyin beriladi — razbor ko'rsatish uchun.
  const review = list.map((qq: any) => ({ correct: Number(qq.correct), why: String(qq.why ?? "") }));
  return NextResponse.json({
    ok: true, correct, total: list.length, coins, review, balance: await balance(user.id),
  });
}
