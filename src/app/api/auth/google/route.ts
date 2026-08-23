import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { googleEnabled, baseUrl } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

/** Google OAuth boshlanishi. GOOGLE_CLIENT_ID/SECRET env YO'Q bo'lsa — bu qism
 *  butunlay "o'chirilgan": tugma ko'rinmaydi (?check=1 -> enabled:false), sayt avvalgidek ishlaydi. */

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("check"))
    return NextResponse.json({ enabled: googleEnabled() });

  if (!googleEnabled())
    return NextResponse.redirect(`${baseUrl(req)}/kirish?xato=google_yoq`);

  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${baseUrl(req)}/api/auth/google/callback`;
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("state", state);
  auth.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(auth.toString());
  // CSRF himoyasi: state cookie'da, callback'da solishtiriladi
  res.cookies.set("g_state", state, {
    httpOnly: true, sameSite: "lax", maxAge: 600, path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
