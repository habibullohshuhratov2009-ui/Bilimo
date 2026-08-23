import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { one } from "@/lib/db/pool";
import { addCoins, balance } from "@/lib/db/queries/coins";
import { track } from "@/lib/db/queries/events";

const COIN_PER_CORRECT = 5;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Kirilmagan" }, { status: 401 });
  const { quizId, answers, durationMs } = await req.json();

  const quiz = await one<{ questions: any }>(`SELECT questions FROM quizzes WHERE id = $1`, [quizId]);
  if (!quiz) return NextResponse.json({ ok: false, error: "Test topilmadi" }, { status: 404 });

  const list = quiz.questions?.questions ?? [];
  let correct = 0;
  list.forEach((qq: any, i: number) => { if (Number(answers?.[i]) === Number(qq.correct)) correct++; });

  const attempt = await one<{ id: number }>(
    `INSERT INTO attempts (user_id, quiz_id, correct, total, duration_ms) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [user.id, quizId, correct, list.length, durationMs ?? null]);
  const coins = correct * COIN_PER_CORRECT;
  if (coins > 0) await addCoins(user.id, coins, "quiz_correct", attempt?.id);
  await track(user.id, "quiz_submit", { correct, total: list.length });

  return NextResponse.json({ ok: true, correct, total: list.length, coins, balance: await balance(user.id) });
}
