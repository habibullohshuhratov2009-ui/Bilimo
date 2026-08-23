import crypto from "node:crypto";

/** PIN scrypt bilan saqlanadi (tuz + sekin funksiya).
 *  Eski sha256 formatidagi yozuvlar ham tekshiriladi — kirgan zahoti yangisiga ko'chadi. */
export function hashPinScrypt(pin: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const dk = crypto.scryptSync(pin, salt, 32, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `scrypt$${salt}$${dk}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  if (stored.startsWith("scrypt$")) {
    const [, salt, dk] = stored.split("$");
    const calc = crypto.scryptSync(pin, salt, 32, { N: 16384, r: 8, p: 1 }).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(calc, "hex"), Buffer.from(dk, "hex"));
  }
  // eski format (sha256) — faqat moslik uchun
  const legacy = crypto.createHash("sha256").update(`sinf-ai:${pin}`).digest("hex");
  return stored.length === legacy.length &&
    crypto.timingSafeEqual(Buffer.from(stored, "hex"), Buffer.from(legacy, "hex"));
}

export function needsRehash(stored: string): boolean {
  return !stored.startsWith("scrypt$");
}
