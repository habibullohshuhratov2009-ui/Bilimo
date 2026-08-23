/** Demo ma'lumot: taqdimotda sinf reytingi bo'sh ko'rinmasin.
 *  Ishlatish: DATABASE_URL=... node scripts/seed.mjs   */
import pg from "pg";
import crypto from "node:crypto";

const hash = (pin) => crypto.createHash("sha256").update(`sinf-ai:${pin}`).digest("hex");
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL yo'q"); process.exit(1); }

const pool = new pg.Pool({
  connectionString: url,
  ssl: process.env.PGSSL === "off" ? undefined : { rejectUnauthorized: false },
});

const CLASS_CODE = "DEMO23";
const students = [
  ["Diyor", 7, 145], ["Malika", 7, 120], ["Javohir", 7, 95],
  ["Nilufar", 7, 70], ["Sardor", 7, 45],
];

const q = (t, p = []) => pool.query(t, p).then((r) => r.rows);

const [teacher] = await q(
  `INSERT INTO users (nickname, role, pin_hash, last_active) VALUES ('UstozAziza','teacher',$1,CURRENT_DATE)
   ON CONFLICT (nickname) DO UPDATE SET pin_hash = EXCLUDED.pin_hash RETURNING id`, [hash("1234")]);

let [cls] = await q(`SELECT id FROM classes WHERE code = $1`, [CLASS_CODE]);
if (!cls) {
  [cls] = await q(`INSERT INTO classes (name, code, teacher_id) VALUES ('7-A sinf',$1,$2) RETURNING id`,
    [CLASS_CODE, teacher.id]);
}
await q(`UPDATE users SET class_id = $1 WHERE id = $2`, [cls.id, teacher.id]);

const [topic] = await q(
  `INSERT INTO topics (class_id, title, subject, created_by) VALUES ($1,'Chiziqli tenglamalar','Matematika',$2)
   RETURNING id`, [cls.id, teacher.id]);

for (const [name, grade, coins] of students) {
  const [u] = await q(
    `INSERT INTO users (nickname, role, pin_hash, class_id, grade, streak, last_active)
     VALUES ($1,'student',$2,$3,$4,$5,CURRENT_DATE)
     ON CONFLICT (nickname) DO UPDATE SET class_id = EXCLUDED.class_id RETURNING id`,
    [name, hash("1234"), cls.id, grade, Math.max(1, Math.round(coins / 40))]);
  const [have] = await q(`SELECT COALESCE(SUM(delta),0)::int AS c FROM coin_ledger WHERE user_id = $1`, [u.id]);
  if (have.c === 0) {
    await q(`INSERT INTO coin_ledger (user_id, delta, reason) VALUES ($1,$2,'seed')`, [u.id, coins]);
    await q(`INSERT INTO attempts (user_id, topic_id, correct, total) VALUES ($1,$2,$3,3)`,
      [u.id, topic.id, Math.min(3, Math.round(coins / 50))]);
  }
}

console.log(`OK: sinf kodi ${CLASS_CODE}, o'qituvchi UstozAziza / PIN 1234, ${students.length} o'quvchi (PIN 1234)`);
await pool.end();
