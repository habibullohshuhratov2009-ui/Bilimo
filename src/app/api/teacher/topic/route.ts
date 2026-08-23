import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { q, one } from "@/lib/db/pool";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "teacher") return NextResponse.json({ ok: false, error: "Faqat o'qituvchi" }, { status: 403 });
  const { title, subject } = await req.json();
  if (!title) return NextResponse.json({ ok: false, error: "Mavzu nomi kerak" }, { status: 400 });
  await q(`UPDATE topics SET is_active = false WHERE class_id = $1`, [user.class_id]);
  const t = await one<{ id: number }>(
    `INSERT INTO topics (class_id, title, subject, created_by) VALUES ($1,$2,$3,$4) RETURNING id`,
    [user.class_id, String(title).slice(0, 200), subject ?? null, user.id]);
  return NextResponse.json({ ok: true, topicId: t?.id });
}
