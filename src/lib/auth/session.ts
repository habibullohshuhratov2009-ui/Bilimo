import { cookies } from "next/headers";
import crypto from "node:crypto";
import { one } from "@/lib/db/pool";
import { env } from "@/lib/config/env";

const COOKIE = "sinf_session";

export type SessionUser = {
  id: number; nickname: string; role: "student" | "teacher";
  class_id: number | null; grade: number | null;
};

export { hashPinScrypt as hashPin, verifyPin, needsRehash } from "@/lib/security/pin";

function sign(userId: number): string {
  // Sir MAJBURIY: fallback bo'lsa, uni bilgan har kim istalgan hisobga kira olardi.
  const secret = env.sessionSecret();
  const mac = crypto.createHmac("sha256", secret).update(String(userId)).digest("hex").slice(0, 32);
  return `${userId}.${mac}`;
}

function verify(token: string): number | null {
  const [id, mac] = token.split(".");
  if (!id || !mac || !/^\d+$/.test(id)) return null;
  const expected = sign(Number(id));
  // Vaqt bo'yicha sizib chiqmasin (MAC ni belgima-belgi taxmin qilishning oldi olinadi).
  if (expected.length !== token.length) return null;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token)) ? Number(id) : null;
}

export async function setSession(userId: number): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const id = verify(token);
  if (!id) return null;
  return await one<SessionUser>(
    `SELECT id, nickname, role, class_id, grade FROM users WHERE id = $1 AND is_deleted = false`, [id]);
}
