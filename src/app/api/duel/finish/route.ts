import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { one, q } from "@/lib/db/pool";
import { addCoins, balance } from "@/lib/db/queries/coins";
import { track } from "@/lib/db/queries/events";

const WIN = 25, PLAY = 5;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Kirilmagan" }, { status: 401 });
  const { code, answers } = await req.json();
  const duel = await one<any>(`SELECT * FROM duels WHERE code = $1`, [String(code ?? "").toUpperCase()]);
  if (!duel) return NextResponse.json({ ok: false, error: "Duel topilmadi" }, { status: 404 });

  // Faqat duel ishtirokchisi yakunlay oladi.
  if (duel.player_a !== user.id && duel.player_b !== user.id)
    return NextResponse.json({ ok: false, error: "Bu duel sizniki emas" }, { status: 403 });

  // BALL SERVERDA hisoblanadi — mijoz yuborgan raqamga ishonilmaydi.
  const quiz = await one<{ questions: any }>(`SELECT questions FROM quizzes WHERE id = $1`, [duel.quiz_id]);
  const list = quiz?.questions?.questions ?? [];
  const score = list.reduce(
    (acc: number, qq: any, i: number) => acc + (Number(answers?.[i]) === Number(qq.correct) ? 1 : 0), 0);

  const isA = duel.player_a === user.id;
  const already = isA ? duel.score_a : duel.score_b;
  if (already !== null && already !== undefined)
    return NextResponse.json({ ok: false, error: "Siz bu duelni allaqachon yakunlagansiz" }, { status: 409 });

  await q(`UPDATE duels SET ${isA ? "score_a" : "score_b"} = $1 WHERE id = $2`, [score, duel.id]);
  await addCoins(user.id, PLAY, "duel_play", duel.id);

  const fresh = await one<any>(`SELECT * FROM duels WHERE id = $1`, [duel.id]);
  let winner: number | null = null;
  if (fresh?.score_a !== null && fresh?.score_b !== null) {
    winner = fresh.score_a === fresh.score_b ? null : (fresh.score_a > fresh.score_b ? fresh.player_a : fresh.player_b);
    await q(`UPDATE duels SET status = 'done', winner_id = $1, finished_at = now() WHERE id = $2`, [winner, duel.id]);
    if (winner) await addCoins(winner, WIN, "duel_win", duel.id);
  }
  await track(user.id, "duel_finish", { duelId: duel.id, score });
  const review = list.map((qq: any) => ({ correct: Number(qq.correct), why: String(qq.why ?? "") }));
  return NextResponse.json({
    ok: true, score, total: list.length, winnerId: winner, review, balance: await balance(user.id),
  });
}
