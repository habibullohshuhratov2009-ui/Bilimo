import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { q, one } from "@/lib/db/pool";
import { ask } from "@/lib/ai/claude";
import { rateLimit } from "@/lib/security/ratelimit";
import { track } from "@/lib/db/queries/events";
import { leakedCanary, sanitizeAiOutput, withCanary, wrapUntrusted } from "@/lib/ai/guard";
export const maxDuration = 60;

const SYSTEM = `Sen — maktab o'qituvchisining yordamchisisan. Senga SINF STATISTIKASI beriladi.
Vazifang: o'qituvchiga qisqa, aniq va FOYDALI xulosa yozish. FAQAT o'zbek tilida.
Qoidalar:
1. Raqamlarni O'YLAB TOPMA — faqat berilgan ma'lumotdan foydalan.
2. Tuzilma: (a) 2 jumlada umumiy holat, (b) "E'tibor bering" — orqada qolayotgan 2-3 o'quvchi va nimasi bilan,
   (c) "Yaxshi ketyapti" — 2-3 o'quvchi, (d) "Tavsiya" — o'qituvchi ertaga nima qilsa bo'ladi (1-2 gap).
3. Hech kimni kamsitma, ayblovchi ohang ishlatma — bular bolalar.
4. Jami 12 qatordan oshmasin.`;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "teacher")
    return NextResponse.json({ ok: false, error: "Faqat o'qituvchi" }, { status: 403 });

  const rl = rateLimit(`teacher-ai:${user.id}`, 5, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Biroz kuting" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const cls = body?.classId
    ? await one<any>(`SELECT id, name FROM classes WHERE id = $1 AND teacher_id = $2`, [body.classId, user.id])
    : await one<any>(`SELECT id, name FROM classes WHERE teacher_id = $1 ORDER BY id LIMIT 1`, [user.id]);
  if (!cls) return NextResponse.json({ ok: false, error: "Sinf topilmadi" }, { status: 404 });

  const students = await q<any>(
    `SELECT v.nickname AS nom, v.coins AS tanga, v.streak,
            (SELECT COUNT(*) FROM attempts a WHERE a.user_id = v.id) AS urinish,
            (SELECT COALESCE(SUM(a.correct),0) FROM attempts a WHERE a.user_id = v.id) AS togri,
            (SELECT COALESCE(SUM(a.total),0) FROM attempts a WHERE a.user_id = v.id) AS jami,
            (SELECT COUNT(*) FROM explanations e WHERE e.user_id = v.id) AS savol,
            (SELECT MAX(a.created_at)::date FROM attempts a WHERE a.user_id = v.id) AS oxirgi
     FROM v_leaderboard v WHERE v.class_id = $1 ORDER BY v.coins DESC`, [cls.id]);

  const topic = await one<any>(
    `SELECT title, subject FROM topics WHERE class_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
    [cls.id]);

  if (!students.length)
    return NextResponse.json({ ok: true, report: "Sinfda hali o'quvchi yo'q. Sinf kodini o'quvchilarga bering." });

  const table = students
    .map((s) => `${s.nom}: tanga ${s.tanga}, urinish ${s.urinish}, to'g'ri ${s.togri}/${s.jami}, savol ${s.savol}, oxirgi faollik ${s.oxirgi ?? "yo'q"}`)
    .join("\n");

  const prompt = `Sinf: ${cls.name}. Bugungi mavzu: ${topic?.title ?? "belgilanmagan"}.\nBugungi sana: ${new Date().toISOString().slice(0, 10)}.\n\nO'QUVCHILAR:\n${table}\n\nO'QITUVCHI SAVOLI (ishonchsiz matn):\n${wrapUntrusted(String(body?.question ?? "Sinf holati qanday? Kim orqada qolyapti, kim test ishlamayapti?"))}`;

  const res = await ask(withCanary(SYSTEM), prompt, 700);
  if (leakedCanary(res.text)) {
    await track(user.id, "canary_leak", { route: "teacher_ai" });
    return NextResponse.json({ ok: false, error: "Hisobot tuzilmadi, qayta urining" }, { status: 400 });
  }
  await track(user.id, "teacher_ai", { classId: cls.id });
  return NextResponse.json({
    ok: true, class: cls.name, report: sanitizeAiOutput(res.text), students: students.length,
  });
}
