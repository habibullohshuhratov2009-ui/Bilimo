import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { one, q } from "@/lib/db/pool";
import { rateLimit, clientIp } from "@/lib/security/ratelimit";
import { track } from "@/lib/db/queries/events";

/** PIN esdan chiqdi — email'ga 6 xonali kod.
 *  MUHIM: kod API javobida HECH QACHON qaytarilmaydi (aks holda istalgan odam
 *  birovning emailini yozib kodni olardi). SMTP ulanmagan bo'lsa — kod faqat
 *  server logiga yoziladi (Railway logs), bu cheklov SECURITY.md da ochiq yozilgan. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`forgot:${ip}`, 5, 15 * 60_000);
  if (!rl.ok)
    return NextResponse.json({ ok: false, error: "Juda ko'p urinish, keyinroq qayta urining" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@"))
    return NextResponse.json({ ok: false, error: "Email kiriting" }, { status: 400 });

  // Javob DOIM bir xil — email bazada bor-yo'qligini oshkor qilmaymiz (enumeration himoyasi).
  const generic = {
    ok: true,
    message: "Agar bu email ro'yxatda bo'lsa, 6 xonali tiklash kodi yaratildi (15 daqiqa amal qiladi). Kod kelmasa — o'qituvchingizdan PIN tiklashni so'rang.",
  };

  const user = await one<{ id: number }>(
    `SELECT id FROM users WHERE LOWER(email) = $1 AND is_deleted = false`, [email]);
  if (!user) return NextResponse.json(generic);

  const perUser = rateLimit(`forgot:u:${user.id}`, 3, 15 * 60_000);
  if (!perUser.ok) return NextResponse.json(generic);

  const code = String(crypto.randomInt(100000, 1000000)); // 6 xona
  const salt = crypto.randomBytes(8).toString("hex");
  const hash = crypto.createHash("sha256").update(`${salt}:${code}`).digest("hex");
  // Eski kodlar kuyadi — bitta amaldagi kod bo'lsin
  await q(`UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL`, [user.id]);
  await q(`INSERT INTO password_resets (user_id, code_hash, salt, expires_at)
           VALUES ($1,$2,$3, now() + interval '15 minutes')`, [user.id, hash, salt]);

  if (process.env.SMTP_URL) {
    // SMTP ulansa shu yerda email jo'natiladi. Hozircha provayder ulanmagan —
    // shuning uchun kod server logiga tushadi (faqat egasi/admin ko'radi).
    console.warn(`[pin-reset] SMTP_URL bor, lekin jo'natuvchi ulanmagan. ${email} uchun kod: ${code}`);
  } else {
    console.warn(`[pin-reset] ${email} uchun tiklash kodi: ${code} (15 daqiqa amal qiladi)`);
  }
  await track(user.id, "pin_forgot");
  return NextResponse.json(generic);
}
