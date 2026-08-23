import { NextResponse } from "next/server";
import { q } from "@/lib/db/pool";
import { setSession, verifyPin, needsRehash, hashPin } from "@/lib/auth/session";
import { rateLimit, clientIp } from "@/lib/security/ratelimit";
import { track } from "@/lib/db/queries/events";

type Row = { id: number; pin_hash: string };

export async function POST(req: Request) {
  // Brute-force himoyasi: bitta IP dan 1 daqiqada 10 urinish.
  const rl = rateLimit(`login:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok)
    return NextResponse.json(
      { ok: false, error: `Juda ko'p urinish. ${rl.retryAfter} soniyadan keyin qayta urinib ko'ring` },
      { status: 429 });

  const body = await req.json().catch(() => ({}));
  // "login" = Ism Familiya YOKI email YOKI eski nik (moslik uchun nickname ham qabul qilinadi)
  const loginRaw = String(body.login ?? body.nickname ?? body.email ?? "").trim();
  const pin = String(body.pin ?? "");
  if (!loginRaw || !pin)
    return NextResponse.json({ ok: false, error: "Ism-familiya (yoki email) va PIN kerak" }, { status: 400 });

  let candidates: Row[];
  if (loginRaw.includes("@")) {
    candidates = await q<Row>(
      `SELECT id, pin_hash FROM users WHERE LOWER(email) = LOWER($1) AND is_deleted = false`, [loginRaw]);
  } else {
    // Ism Familiya bo'yicha (katta-kichik harf farqsiz) yoki eski nik bo'yicha
    candidates = await q<Row>(
      `SELECT id, pin_hash FROM users
       WHERE is_deleted = false AND (
         nickname = $1 OR
         LOWER(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))) = LOWER(TRIM($1))
       ) LIMIT 5`, [loginRaw]);
  }

  // Bir xil ism-familiya bo'lsa — PIN qaysi hisobga tushsa, o'sha kiradi.
  const user = candidates.find((u) => verifyPin(pin, u.pin_hash));
  // Bir xil xabar: hisob bor-yo'qligini oshkor qilmaymiz.
  if (!user)
    return NextResponse.json({ ok: false, error: "Ism-familiya/email yoki PIN xato" }, { status: 401 });
  if (needsRehash(user.pin_hash))
    await q(`UPDATE users SET pin_hash = $1 WHERE id = $2`, [hashPin(pin), user.id]);
  await q(`UPDATE users SET streak = CASE WHEN last_active = CURRENT_DATE - 1 THEN streak + 1
             WHEN last_active = CURRENT_DATE THEN streak ELSE 1 END, last_active = CURRENT_DATE WHERE id = $1`, [user.id]);
  await setSession(user.id);
  await track(user.id, "login");
  return NextResponse.json({ ok: true });
}
