import crypto from "node:crypto";
import { q, one } from "@/lib/db/pool";

/** Taqdimot uchun demo sinf. Idempotent — bir necha marta chaqirsa ham dubl bo'lmaydi. */
const legacyHash = (pin: string) => crypto.createHash("sha256").update(`sinf-ai:${pin}`).digest("hex");

export async function seedDemo(): Promise<{ classCode: string; students: number }> {
  const CODE = "DEMO23";
  const pin = legacyHash("1234"); // kirganda avtomatik scrypt ga ko'chadi

  const teacher = await one<{ id: number }>(
    `INSERT INTO users (nickname, role, pin_hash, last_active) VALUES ('UstozAziza','teacher',$1,CURRENT_DATE)
     ON CONFLICT (nickname) DO UPDATE SET pin_hash = EXCLUDED.pin_hash RETURNING id`, [pin]);

  let cls = await one<{ id: number }>(`SELECT id FROM classes WHERE code = $1`, [CODE]);
  if (!cls) {
    cls = await one<{ id: number }>(
      `INSERT INTO classes (name, code, teacher_id) VALUES ('7-A sinf',$1,$2) RETURNING id`, [CODE, teacher!.id]);
  }
  await q(`UPDATE users SET class_id = $1 WHERE id = $2`, [cls!.id, teacher!.id]);

  const hasTopic = await one(`SELECT id FROM topics WHERE class_id = $1 AND is_active = true`, [cls!.id]);
  const topic = hasTopic ?? await one<{ id: number }>(
    `INSERT INTO topics (class_id, title, subject, created_by)
     VALUES ($1,'Chiziqli tenglamalar','Matematika',$2) RETURNING id`, [cls!.id, teacher!.id]);

  const students: [string, number, number][] = [
    ["Diyor", 7, 145], ["Malika", 7, 120], ["Javohir", 7, 95], ["Nilufar", 7, 70], ["Sardor", 7, 45],
  ];
  for (const [name, grade, coins] of students) {
    const u = await one<{ id: number }>(
      `INSERT INTO users (nickname, role, pin_hash, class_id, grade, streak, last_active)
       VALUES ($1,'student',$2,$3,$4,$5,CURRENT_DATE)
       ON CONFLICT (nickname) DO UPDATE SET class_id = EXCLUDED.class_id RETURNING id`,
      [name, pin, cls!.id, grade, Math.max(1, Math.round(coins / 40))]);
    const have = await one<{ c: number }>(
      `SELECT COALESCE(SUM(delta),0)::int AS c FROM coin_ledger WHERE user_id = $1`, [u!.id]);
    if (Number(have?.c ?? 0) === 0) {
      await q(`INSERT INTO coin_ledger (user_id, delta, reason) VALUES ($1,$2,'seed')`, [u!.id, coins]);
      await q(`INSERT INTO attempts (user_id, topic_id, correct, total) VALUES ($1,$2,$3,3)`,
        [u!.id, (topic as any)!.id, Math.min(3, Math.round(coins / 50))]);
    }
  }
  return { classCode: CODE, students: students.length };
}
