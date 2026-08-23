import { NextResponse } from "next/server";
import { one, q } from "@/lib/db/pool";
import { currentUser } from "@/lib/auth/session";
import { track } from "@/lib/db/queries/events";

/** Google orqali kirgan o'quvchi birinchi kirishda sinf kodini kiritadi. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Kirilmagan" }, { status: 401 });
  if (user.role !== "student")
    return NextResponse.json({ ok: false, error: "Faqat o'quvchi uchun" }, { status: 403 });
  if (user.class_id)
    return NextResponse.json({ ok: false, error: "Siz allaqachon sinfdasiz" }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const codeRaw = String(body.classCode ?? "").trim().toUpperCase();
  const grade = Number(body.grade);
  if (!codeRaw) return NextResponse.json({ ok: false, error: "Sinf kodi kerak" }, { status: 400 });

  const cls = await one<{ id: number; name: string }>(`SELECT id, name FROM classes WHERE code = $1`, [codeRaw]);
  if (!cls) return NextResponse.json({ ok: false, error: "Bunday sinf kodi yo'q" }, { status: 400 });

  await q(`UPDATE users SET class_id = $1, grade = COALESCE($2, grade) WHERE id = $3`,
    [cls.id, Number.isInteger(grade) && grade >= 1 && grade <= 11 ? grade : null, user.id]);
  await track(user.id, "join_class", { classId: cls.id });
  return NextResponse.json({ ok: true, className: cls.name });
}
