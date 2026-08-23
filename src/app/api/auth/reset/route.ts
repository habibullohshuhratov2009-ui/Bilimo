import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { one, q } from "@/lib/db/pool";
import { hashPin, setSession } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/security/ratelimit";
import { track } from "@/lib/db/queries/events";

/** Email + 6 xonali kod bilan yangi PIN o'rnatish. Kod: 15 daqiqa, 5 urinish, bir marta. */
export async function POST(req: Request) {
  const rl = rateLimit(`reset:${clientIp(req)}`, 10, 15 * 60_000);
  if (!rl.ok)
    return NextResponse.json({ ok: false, error: "Juda ko'p urinish, keyinroq qayta urining" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const code = String(body.code ?? "").trim();
  const newPin = String(body.newPin ?? "").trim();
  if (!email || !/^\d{6}$/.test(code))
    return NextResponse.json({ ok: false, error: "Email va 6 xonali kod kerak" }, { status: 400 });
  if (!/^\d{4,8}$/.test(newPin) || ["0000", "1111", "1234", "12345", "123456"].includes(newPin))
    return NextResponse.json({ ok: false, error: "Yangi PIN 4–8 raqam bo'lsin (juda oson bo'lmasin)" }, { status: 400 });

  const user = await one<{ id: number }>(
    `SELECT id FROM users WHERE LOWER(email) = $1 AND is_deleted = false`, [email]);
  const bad = NextResponse.json({ ok: false, error: "Kod xato yoki muddati o'tgan" }, { status: 400 });
  if (!user) return bad;

  const pr = await one<{ id: number; code_hash: string; salt: string; attempts: number }>(
    `SELECT id, code_hash, salt, attempts FROM password_resets
     WHERE user_id = $1 AND used_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`, [user.id]);
  if (!pr) return bad;
  if (pr.attempts >= 5) {
    await q(`UPDATE password_resets SET used_at = now() WHERE id = $1`, [pr.id]);
    return NextResponse.json({ ok: false, error: "Ko'p xato urinish — yangi kod so'rang" }, { status: 429 });
  }
  await q(`UPDATE password_resets SET attempts = attempts + 1 WHERE id = $1`, [pr.id]);

  const calc = crypto.createHash("sha256").update(`${pr.salt}:${code}`).digest("hex");
  const okCode = calc.length === pr.code_hash.length &&
    crypto.timingSafeEqual(Buffer.from(calc, "hex"), Buffer.from(pr.code_hash, "hex"));
  if (!okCode) return bad;

  await q(`UPDATE password_resets SET used_at = now() WHERE id = $1`, [pr.id]);
  await q(`UPDATE users SET pin_hash = $1 WHERE id = $2`, [hashPin(newPin), user.id]);
  await setSession(user.id);
  await track(user.id, "pin_reset", { via: "email_code" });
  return NextResponse.json({ ok: true });
}
