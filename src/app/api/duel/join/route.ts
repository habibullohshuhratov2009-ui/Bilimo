import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { one, q } from "@/lib/db/pool";
import { track } from "@/lib/db/queries/events";
import { rateLimit } from "@/lib/security/ratelimit";
import { publicQuestions } from "@/lib/ai/sanitize";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Kirilmagan" }, { status: 401 });
  // 5 belgili kodni terib topishning oldini olamiz.
  const rl = rateLimit(`join:${user.id}`, 15, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Biroz kuting" }, { status: 429 });

  const { code } = await req.json();
  const duel = await one<{ id: number; quiz_id: number; player_a: number; status: string }>(
    `SELECT id, quiz_id, player_a, status FROM duels WHERE code = $1`, [String(code ?? "").toUpperCase()]);
  if (!duel) return NextResponse.json({ ok: false, error: "Bunday duel yo'q" }, { status: 404 });
  if (duel.player_a !== user.id && duel.status === "waiting") {
    // ATOMIK: ikki o'quvchi bir vaqtda kirsa, faqat BIRINCHISI ikkinchi o'yinchi bo'ladi.
    const taken = await one<{ id: number }>(
      `UPDATE duels SET player_b = $1, status = 'playing'
       WHERE id = $2 AND status = 'waiting' AND player_b IS NULL RETURNING id`, [user.id, duel.id]);
    if (!taken)
      return NextResponse.json({ ok: false, error: "Bu duelga boshqa o'quvchi qo'shilib bo'lgan" }, { status: 409 });
  }
  const quiz = await one<{ questions: any }>(`SELECT questions FROM quizzes WHERE id = $1`, [duel.quiz_id]);
  await track(user.id, "duel_join", { duelId: duel.id });
  return NextResponse.json({ ok: true, duelId: duel.id, quizId: duel.quiz_id, questions: publicQuestions(quiz?.questions?.questions ?? []) });
}
