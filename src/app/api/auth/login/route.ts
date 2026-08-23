import { NextResponse } from "next/server";
import { one, q } from "@/lib/db/pool";
import { setSession, verifyPin, needsRehash, hashPin } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/security/ratelimit";
import { track } from "@/lib/db/queries/events";

export async function POST(req: Request) {
  // Brute-force himoyasi: bitta IP dan 1 daqiqada 10 urinish.
  const rl = rateLimit(`login:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok)
    return NextResponse.json(
      { ok: false, error: `Juda ko'p urinish. ${rl.retryAfter} soniyadan keyin qayta urinib ko'ring` },
      { status: 429 });

  const { nickname, pin } = await req.json();
  if (!nickname || !pin) return NextResponse.json({ ok: false, error: "Nik va PIN kerak" }, { status: 400 });
  const user = await one<{ id: number; pin_hash: string }>(
    `SELECT id, pin_hash FROM users WHERE nickname = $1 AND is_deleted = false`, [String(nickname)]);
  // Bir xil xabar: nik bor-yo'qligini oshkor qilmaymiz.
  if (!user || !verifyPin(String(pin), user.pin_hash))
    return NextResponse.json({ ok: false, error: "Nik yoki PIN xato" }, { status: 401 });
  if (needsRehash(user.pin_hash))
    await q(`UPDATE users SET pin_hash = $1 WHERE id = $2`, [hashPin(String(pin)), user.id]);
  await q(`UPDATE users SET streak = CASE WHEN last_active = CURRENT_DATE - 1 THEN streak + 1
             WHEN last_active = CURRENT_DATE THEN streak ELSE 1 END, last_active = CURRENT_DATE WHERE id = $1`, [user.id]);
  await setSession(user.id);
  await track(user.id, "login");
  return NextResponse.json({ ok: true });
}
