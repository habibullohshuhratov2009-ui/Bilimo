import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { q, one } from "@/lib/db/pool";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "teacher") return NextResponse.json({ ok: false, error: "Faqat o'qituvchi" }, { status: 403 });
  const cls = await one<any>(`SELECT id, name, code, grade FROM classes WHERE teacher_id = $1`, [user.id]);
  if (!cls) return NextResponse.json({ ok: false, error: "Sinf yo'q" }, { status: 404 });
  const students = await q(
    `SELECT v.id, v.nickname, v.full_name AS name, v.coins, v.streak,
            (SELECT COUNT(*) FROM attempts a WHERE a.user_id = v.id) AS attempts,
            (SELECT COALESCE(SUM(a.correct),0) FROM attempts a WHERE a.user_id = v.id) AS correct,
            (SELECT COALESCE(SUM(a.total),0) FROM attempts a WHERE a.user_id = v.id) AS total,
            (SELECT COUNT(*) FROM explanations e WHERE e.user_id = v.id) AS questions,
            (SELECT MAX(u.last_active) FROM users u WHERE u.id = v.id) AS last_active
     FROM v_leaderboard v WHERE v.class_id = $1 ORDER BY v.coins DESC`, [cls.id]);
  const topic = await one<any>(
    `SELECT title, subject FROM topics WHERE class_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`, [cls.id]);
  return NextResponse.json({ ok: true, class: cls, students, topic });
}
