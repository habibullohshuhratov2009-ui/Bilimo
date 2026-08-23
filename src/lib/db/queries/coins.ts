import { q, one } from "@/lib/db/pool";

export async function addCoins(userId: number, delta: number, reason: string, refId?: number) {
  await q(`INSERT INTO coin_ledger (user_id, delta, reason, ref_id) VALUES ($1,$2,$3,$4)`,
    [userId, delta, reason, refId ?? null]);
}

export async function balance(userId: number): Promise<number> {
  const row = await one<{ coins: string }>(
    `SELECT COALESCE(SUM(delta),0) AS coins FROM coin_ledger WHERE user_id = $1`, [userId]);
  return Number(row?.coins ?? 0);
}

export async function leaderboard(classId: number | null, limit = 10) {
  if (!classId) return [];
  return q(`SELECT nickname, full_name AS name, coins, streak FROM v_leaderboard
            WHERE class_id = $1 ORDER BY coins DESC, full_name ASC LIMIT $2`, [classId, limit]);
}
