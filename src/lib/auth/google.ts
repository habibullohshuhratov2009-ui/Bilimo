/** Google OAuth yordamchilari. Kalitlar env'da bo'lmasa — funksiya butunlay o'chiq. */
export function googleEnabled(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** Railway proksi ortida to'g'ri domen: x-forwarded-* sarlavhalaridan. */
export function baseUrl(req: Request): string {
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
