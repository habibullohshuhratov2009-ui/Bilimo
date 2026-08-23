import crypto from "node:crypto";
import { one } from "@/lib/db/pool";

/** Ism-familiya bilan ishlash: ekranda DOIM "Ism Familiya", nickname esa ICHKI unikal ID. */

const CYR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "",
  э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

export function translit(s: string): string {
  return s
    .toLowerCase()
    .split("")
    .map((ch) => CYR[ch] ?? ch)
    .join("")
    .replace(/['’ʼ`-]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 18) || "user";
}

/** Ekranda ko'rinadigan ism: "Ism Familiya", bo'lmasa eski nickname. */
export function fullName(first?: string | null, last?: string | null, fallback = ""): string {
  const n = `${first ?? ""} ${last ?? ""}`.trim();
  return n || fallback;
}

/** Ichki unikal nickname yasaydi: aziz_karimov_483 ko'rinishida. */
export async function makeNickname(first: string, last: string): Promise<string> {
  const base = translit(`${first}_${last}`);
  for (let i = 0; i < 6; i++) {
    const cand = i === 0 ? base : `${base}_${crypto.randomInt(100, 1000)}`;
    const taken = await one(`SELECT 1 FROM users WHERE nickname = $1`, [cand]);
    if (!taken) return cand.slice(0, 24);
  }
  return `${base}_${Date.now() % 100000}`.slice(0, 24);
}

/** Ism/familiya validatsiyasi uchun regex — harf, apostrof, defis. */
export const NAME_RE = /^[A-Za-zЀ-ӿ'’ʼ`\- ]{2,30}$/;
