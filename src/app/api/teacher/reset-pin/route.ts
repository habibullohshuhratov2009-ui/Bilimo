import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { one, q } from "@/lib/db/pool";
import { currentUser, hashPin } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/ratelimit";
import { track } from "@/lib/db/queries/events";

const WEAK = new Set(["0000", "1111", "1234"]);

/** O'qituvchi O'Z sinfidagi o'quvchining PIN'ini tiklaydi.
 *  Yangi PIN javobda BIR MARTA ko'rsatiladi — o'qituvchi bolaga og'zaki aytadi.
 *  Bu maktab uchun eng real yo'l: bolalarda ko'pincha email yo'q. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "teacher")
    return NextResponse.json({ ok: false, error: "Faqat o'qituvchi" }, { status: 403 });

  const rl = rateLimit(`resetpin:${user.id}`, 10, 60_000);
  if (!rl.ok)
    return NextResponse.json({ ok: false, error: "Juda ko'p urinish, biroz kuting" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const studentId = Number(body.studentId);
  if (!Number.isInteger(studentId) || studentId <= 0)
    return NextResponse.json({ ok: false, error: "studentId kerak" }, { status: 400 });

  // Faqat O'Z sinfidagi o'quvchi (boshqa sinfga tegib bo'lmaydi)
  const student = await one<{ id: number; first_name: string | null; last_name: string | null; nickname: string }>(
    `SELECT u.id, u.first_name, u.last_name, u.nickname
     FROM users u JOIN classes c ON c.id = u.class_id
     WHERE u.id = $1 AND c.teacher_id = $2 AND u.role = 'student' AND u.is_deleted = false`,
    [studentId, user.id]);
  if (!student)
    return NextResponse.json({ ok: false, error: "Bu o'quvchi sizning sinfingizda emas" }, { status: 404 });

  let pin = "";
  do { pin = String(crypto.randomInt(0, 10000)).padStart(4, "0"); } while (WEAK.has(pin));
  await q(`UPDATE users SET pin_hash = $1 WHERE id = $2`, [hashPin(pin), student.id]);
  await track(user.id, "teacher_reset_pin", { studentId: student.id });

  const name = `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || student.nickname;
  return NextResponse.json({ ok: true, pin, student: name });
}
