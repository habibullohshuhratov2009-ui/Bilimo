import { NextResponse } from "next/server";
import { one, q } from "@/lib/db/pool";
import { hashPin, setSession } from "@/lib/auth/session";
import { track } from "@/lib/db/queries/events";

export async function POST(req: Request) {
  const { nickname, pin } = await req.json();
  if (!nickname || !pin) return NextResponse.json({ ok: false, error: "Nik va PIN kerak" }, { status: 400 });
  const user = await one<{ id: number }>(
    `SELECT id FROM users WHERE nickname = $1 AND pin_hash = $2 AND is_deleted = false`,
    [nickname, hashPin(pin)]);
  if (!user) return NextResponse.json({ ok: false, error: "Nik yoki PIN xato" }, { status: 401 });
  await q(`UPDATE users SET streak = CASE WHEN last_active = CURRENT_DATE - 1 THEN streak + 1
             WHEN last_active = CURRENT_DATE THEN streak ELSE 1 END, last_active = CURRENT_DATE WHERE id = $1`, [user.id]);
  await setSession(user.id);
  await track(user.id, "login");
  return NextResponse.json({ ok: true });
}
