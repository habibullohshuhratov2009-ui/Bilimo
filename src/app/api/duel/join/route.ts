import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { one, q } from "@/lib/db/pool";
import { track } from "@/lib/db/queries/events";
import { publicQuestions } from "@/lib/ai/sanitize";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Kirilmagan" }, { status: 401 });
  const { code } = await req.json();
  const duel = await one<{ id: number; quiz_id: number; player_a: number; status: string }>(
    `SELECT id, quiz_id, player_a, status FROM duels WHERE code = $1`, [String(code ?? "").toUpperCase()]);
  if (!duel) return NextResponse.json({ ok: false, error: "Bunday duel yo'q" }, { status: 404 });
  if (duel.player_a !== user.id && duel.status === "waiting") {
    await q(`UPDATE duels SET player_b = $1, status = 'playing' WHERE id = $2`, [user.id, duel.id]);
  }
  const quiz = await one<{ questions: any }>(`SELECT questions FROM quizzes WHERE id = $1`, [duel.quiz_id]);
  await track(user.id, "duel_join", { duelId: duel.id });
  return NextResponse.json({ ok: true, duelId: duel.id, quizId: duel.quiz_id, questions: publicQuestions(quiz?.questions?.questions ?? []) });
}
