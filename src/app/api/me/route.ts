import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { balance, leaderboard } from "@/lib/db/queries/coins";
import { one } from "@/lib/db/pool";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Kirilmagan" }, { status: 401 });
  const cls = user.class_id
    ? await one<{ name: string; code: string }>(`SELECT name, code FROM classes WHERE id = $1`, [user.class_id])
    : null;
  const topic = user.class_id
    ? await one<{ id: number; title: string; subject: string }>(
        `SELECT id, title, subject FROM topics WHERE class_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
        [user.class_id])
    : null;
  return NextResponse.json({
    ok: true, user, coins: await balance(user.id),
    class: cls, topic, leaderboard: await leaderboard(user.class_id),
  });
}
