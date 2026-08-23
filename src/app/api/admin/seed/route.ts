import { NextResponse } from "next/server";
import { migrate } from "@/lib/db/migrate";
import { seedDemo } from "@/lib/db/seed";
import { q } from "@/lib/db/pool";
export const dynamic = "force-dynamic";

/** Faqat SEED_TOKEN bilan. Demo ma'lumotni bir marta joylash uchun. */
export async function POST(req: Request) {
  const token = process.env.SEED_TOKEN;
  if (!token || req.headers.get("x-seed-token") !== token)
    return NextResponse.json({ ok: false, error: "Ruxsat yo'q" }, { status: 403 });
  await migrate();

  // Taqdimotdan oldin sinov akkauntlarini tozalash (?cleanup=1).
  let removed = 0;
  if (new URL(req.url).searchParams.get("cleanup") === "1") {
    const rows = await q<{ id: number }>(
      `SELECT id FROM users
       WHERE role = 'student'
         AND (nickname ~* '^(test|hack|live|demo[0-9]|weak)' OR nickname !~ '^[A-Za-z0-9_]+$')
         AND nickname NOT IN ('Diyor','Malika','Javohir','Nilufar','Sardor')`);
    for (const r of rows) {
      await q(`DELETE FROM coin_ledger WHERE user_id = $1`, [r.id]);
      await q(`DELETE FROM attempts WHERE user_id = $1`, [r.id]);
      await q(`DELETE FROM explanations WHERE user_id = $1`, [r.id]);
      await q(`DELETE FROM events WHERE user_id = $1`, [r.id]);
      await q(`DELETE FROM duels WHERE player_a = $1 OR player_b = $1`, [r.id]);
      await q(`DELETE FROM quizzes WHERE created_by = $1`, [r.id]);
      await q(`DELETE FROM users WHERE id = $1`, [r.id]);
      removed++;
    }
  }

  const res = await seedDemo();
  return NextResponse.json({ ok: true, removed, ...res });
}
