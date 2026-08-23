import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { ask, parseQuiz } from "@/lib/ai/claude";
import { DUEL_SYSTEM } from "@/lib/ai/prompts";
import { one } from "@/lib/db/pool";
import { track } from "@/lib/db/queries/events";
import { publicQuestions } from "@/lib/ai/sanitize";
import { rateLimit } from "@/lib/security/ratelimit";
export const maxDuration = 60;

function code(len = 5) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => abc[Math.floor(Math.random() * abc.length)]).join("");
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Kirilmagan" }, { status: 401 });
  const rl = rateLimit(`duel:${user.id}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Biroz kuting" }, { status: 429 });

  const { topic } = await req.json().catch(() => ({ topic: null }));

  const active = user.class_id
    ? await one<{ title: string }>(
        `SELECT title FROM topics WHERE class_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
        [user.class_id])
    : null;
  const theme = (topic || active?.title || "maktab dasturi: matematika va ona tili").toString().slice(0, 200);

  const gen = await ask(DUEL_SYSTEM, `Mavzu: ${theme}. Sinf: ${user.grade ?? 7}-sinf.`, 900);
  const questions = parseQuiz(gen.text);
  const quiz = await one<{ id: number }>(
    `INSERT INTO quizzes (source, questions, created_by) VALUES ('duel',$1,$2) RETURNING id`,
    [JSON.stringify({ questions }), user.id]);

  const duel = await one<{ id: number; code: string }>(
    `INSERT INTO duels (code, class_id, quiz_id, player_a) VALUES ($1,$2,$3,$4) RETURNING id, code`,
    [code(), user.class_id, quiz!.id, user.id]);

  await track(user.id, "duel_create", { duelId: duel?.id, theme });
  return NextResponse.json({ ok: true, code: duel?.code, quizId: quiz?.id, questions: publicQuestions(questions) });
}
