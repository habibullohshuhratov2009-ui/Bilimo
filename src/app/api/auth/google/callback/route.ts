import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { one, q } from "@/lib/db/pool";
import { setSession } from "@/lib/auth/session";
import { hashPinScrypt } from "@/lib/security/pin";
import { makeNickname } from "@/lib/auth/names";
import { track } from "@/lib/db/queries/events";
import { addCoins } from "@/lib/db/queries/coins";
import { googleEnabled, baseUrl } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

type GooglePayload = {
  sub?: string; email?: string; email_verified?: boolean;
  given_name?: string; family_name?: string; name?: string;
};

/** Google'dan qaytish: kod -> token -> foydalanuvchi. Har qanday xatoda saytni
 *  buzmasdan /kirish sahifasiga xato belgisi bilan qaytamiz. */
export async function GET(req: Request) {
  const back = (err: string) => NextResponse.redirect(`${baseUrl(req)}/kirish?xato=${err}`);
  if (!googleEnabled()) return back("google_yoq");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.headers.get("cookie")?.match(/(?:^|;\s*)g_state=([a-f0-9]+)/)?.[1];
  if (!code || !state || !cookieState || state !== cookieState) return back("google");

  try {
    // Kodni tokenga almashtirish — Google'ning TLS himoyalangan endpointi
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl(req)}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    const idToken: string | undefined = tokens.id_token;
    if (!tokenRes.ok || !idToken) return back("google");

    // id_token to'g'ridan-to'g'ri Google'dan TLS orqali keldi — payload'ni o'qiymiz
    const payload: GooglePayload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"));
    const { sub, email } = payload;
    if (!sub || !email || payload.email_verified === false) return back("google");
    const emailLc = email.toLowerCase();

    // 1) google_sub bo'yicha, 2) email bo'yicha topamiz (hisobni bog'laymiz), 3) yangi yaratamiz
    let user = await one<{ id: number; role: string; class_id: number | null }>(
      `SELECT id, role, class_id FROM users WHERE google_sub = $1 AND is_deleted = false`, [sub]);
    if (!user) {
      user = await one(
        `UPDATE users SET google_sub = $1 WHERE LOWER(email) = $2 AND is_deleted = false AND google_sub IS NULL
         RETURNING id, role, class_id`, [sub, emailLc]);
    }
    if (!user) {
      const first = payload.given_name?.trim() || emailLc.split("@")[0];
      const last = payload.family_name?.trim() || null;
      const nickname = await makeNickname(first, last ?? "");
      // PIN yo'q — kirish faqat Google orqali (xohlasa keyin o'qituvchi PIN beradi)
      const randomPin = hashPinScrypt(crypto.randomBytes(16).toString("hex"));
      user = await one(
        `INSERT INTO users (nickname, first_name, last_name, email, google_sub, role, pin_hash, last_active)
         VALUES ($1,$2,$3,$4,$5,'student',$6, CURRENT_DATE) RETURNING id, role, class_id`,
        [nickname, first, last, emailLc, sub, randomPin]);
      if (user) {
        await addCoins(user.id, 10, "welcome");
        await track(user.id, "register", { role: "student", via: "google" });
      }
    }
    if (!user) return back("google");

    await q(`UPDATE users SET streak = CASE WHEN last_active = CURRENT_DATE - 1 THEN streak + 1
               WHEN last_active = CURRENT_DATE THEN streak ELSE 1 END, last_active = CURRENT_DATE WHERE id = $1`, [user.id]);
    await setSession(user.id);
    await track(user.id, "login", { via: "google" });

    const res =
      user.role === "teacher"
        ? NextResponse.redirect(`${baseUrl(req)}/ustoz`)
        : user.class_id
          ? NextResponse.redirect(`${baseUrl(req)}/panel`)
          : NextResponse.redirect(`${baseUrl(req)}/kirish?sinf=1`); // birinchi kirish: sinf kodi so'raladi
    res.cookies.delete("g_state");
    return res;
  } catch {
    return back("google");
  }
}
