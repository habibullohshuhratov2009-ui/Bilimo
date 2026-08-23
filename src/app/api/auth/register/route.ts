import { NextResponse } from "next/server";
import { z } from "zod";
import { q, one } from "@/lib/db/pool";
import { hashPin, setSession } from "@/lib/auth/session";
import { makeNickname, NAME_RE } from "@/lib/auth/names";
import { track } from "@/lib/db/queries/events";
import { rateLimit, clientIp } from "@/lib/security/ratelimit";
import { addCoins } from "@/lib/db/queries/coins";

const Body = z.object({
  // Yangi yo'l: ism + familiya (ustozlar ro'yxatda haqiqiy ismni ko'radi)
  firstName: z.string().trim().regex(NAME_RE, "Ismda faqat harf bo'lsin (2–30)").optional(),
  lastName: z.string().trim().regex(NAME_RE, "Familiyada faqat harf bo'lsin (2–30)").optional(),
  // Email — ixtiyoriy, faqat PIN esdan chiqsa tiklash uchun
  email: z.string().trim().toLowerCase().email("Email noto'g'ri").max(120)
    .optional().or(z.literal("").transform(() => undefined)),
  // Eski yo'l (moslik): nickname bilan ham ro'yxatdan o'tish ishlaydi
  nickname: z.string().min(2).max(24)
    .regex(/^[A-Za-z0-9_Ѐ-ӿ]+$/, "Nikda faqat harf, raqam va _ bo'lishi mumkin").optional(),
  pin: z.string().min(4).max(8).regex(/^\d+$/, "PIN faqat raqamlardan iborat")
    .refine((v) => !["0000", "1111", "1234", "12345", "123456"].includes(v), "Bunday PIN juda oson"),
  role: z.enum(["student", "teacher"]),
  classCode: z.string().optional(),
  className: z.string().optional(),
  grade: z.coerce.number().int().min(1).max(11).optional(),
  inviteCode: z.string().optional(),
}).refine((b) => (b.firstName && b.lastName) || b.nickname, {
  message: "Ism va familiyani kiriting",
});

function code(len = 6) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => abc[Math.floor(Math.random() * abc.length)]).join("");
}

export async function POST(req: Request) {
  const rl = rateLimit(`register:${clientIp(req)}`, 5, 60_000);
  if (!rl.ok)
    return NextResponse.json({ ok: false, error: "Juda ko'p urinish, biroz kuting" }, { status: 429 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ ok: false, error: first?.message ?? "Ma'lumot to'liq emas" }, { status: 400 });
  }
  const b = parsed.data;

  // Ism/familiya (yangi) yoki nickname (eski moslik)
  const firstName = b.firstName?.trim() ?? b.nickname!;
  const lastName = b.lastName?.trim() ?? null;

  // Ichki nickname: berilgan bo'lsa — o'sha, bo'lmasa avtomatik (ism_familiya_123)
  let nickname: string;
  if (b.nickname) {
    const exists = await one(`SELECT id FROM users WHERE nickname = $1`, [b.nickname]);
    if (exists) return NextResponse.json({ ok: false, error: "Bu nik band" }, { status: 409 });
    nickname = b.nickname;
  } else {
    nickname = await makeNickname(firstName, lastName ?? "");
  }

  if (b.email) {
    const emailTaken = await one(`SELECT id FROM users WHERE LOWER(email) = $1`, [b.email]);
    if (emailTaken)
      return NextResponse.json({ ok: false, error: "Bu email allaqachon ro'yxatda" }, { status: 409 });
  }

  let classId: number | null = null;
  if (b.role === "student") {
    if (!b.classCode) return NextResponse.json({ ok: false, error: "Sinf kodi kerak" }, { status: 400 });
    const cls = await one<{ id: number }>(`SELECT id FROM classes WHERE code = $1`, [b.classCode.toUpperCase()]);
    if (!cls) return NextResponse.json({ ok: false, error: "Bunday sinf kodi yo'q" }, { status: 400 });
    classId = cls.id;
  }

  const user = await one<{ id: number }>(
    `INSERT INTO users (nickname, first_name, last_name, email, role, pin_hash, class_id, grade, last_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CURRENT_DATE) RETURNING id`,
    [nickname, firstName, lastName, b.email ?? null, b.role, hashPin(b.pin), classId, b.grade ?? null]);
  if (!user) return NextResponse.json({ ok: false, error: "Saqlanmadi" }, { status: 500 });

  if (b.role === "teacher") {
    const cls = await one<{ id: number; code: string }>(
      `INSERT INTO classes (name, code, teacher_id) VALUES ($1,$2,$3) RETURNING id, code`,
      [b.className?.trim() || `${firstName} sinfi`, code(), user.id]);
    await q(`UPDATE users SET class_id = $1 WHERE id = $2`, [cls?.id ?? null, user.id]);
    classId = cls?.id ?? null;
  }

  // Taklif bo'yicha kelgan bo'lsa — ikkalasiga tanga (viral halqa)
  if (b.inviteCode) {
    const inv = await one<{ id: number; inviter_id: number }>(
      `SELECT id, inviter_id FROM invites WHERE code = $1 AND invited_id IS NULL`, [b.inviteCode.toUpperCase()]);
    if (inv) {
      await q(`UPDATE invites SET invited_id = $1, used_at = now() WHERE id = $2`, [user.id, inv.id]);
      await addCoins(inv.inviter_id, 30, "invite", user.id);
      await addCoins(user.id, 20, "invite", inv.inviter_id);
    }
  }

  await addCoins(user.id, 10, "welcome");
  await track(user.id, "register", { role: b.role });
  await setSession(user.id);

  const cls = classId ? await one<{ code: string; name: string }>(`SELECT code, name FROM classes WHERE id = $1`, [classId]) : null;
  return NextResponse.json({ ok: true, classCode: cls?.code ?? null, className: cls?.name ?? null });
}
