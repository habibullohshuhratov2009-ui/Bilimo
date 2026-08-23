import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { ask, parseQuiz } from "@/lib/ai/claude";
import { EXPLAIN_SYSTEM, QUIZ_SYSTEM } from "@/lib/ai/prompts";
import { one } from "@/lib/db/pool";
import { track } from "@/lib/db/queries/events";
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Kirilmagan" }, { status: 401 });
  const { text } = await req.json();
  if (!text || String(text).trim().length < 3)
    return NextResponse.json({ ok: false, error: "Savolni yozing" }, { status: 400 });

  const explain = await ask(EXPLAIN_SYSTEM, String(text).slice(0, 2000));
  const row = await one<{ id: number }>(
    `INSERT INTO explanations (user_id, input_text, output_md, model, input_tokens, out_tokens)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [user.id, String(text).slice(0, 2000), explain.text, explain.model, explain.inTokens, explain.outTokens]);

  let quizId: number | null = null;
  let questions: unknown[] = [];
  try {
    const quiz = await ask(QUIZ_SYSTEM, `Mavzu/savol: ${text}\n\nTushuntirish:\n${explain.text}`, 700);
    questions = parseQuiz(quiz.text);
    const saved = await one<{ id: number }>(
      `INSERT INTO quizzes (source, questions, created_by) VALUES ('solve',$1,$2) RETURNING id`,
      [JSON.stringify({ questions }), user.id]);
    quizId = saved?.id ?? null;
  } catch {
    /* test tuzilmasa ham tushuntirish beriladi */
  }

  await track(user.id, "solve", { explanationId: row?.id, hasQuiz: !!quizId });
  return NextResponse.json({ ok: true, explanation: explain.text, quizId, questions });
}
