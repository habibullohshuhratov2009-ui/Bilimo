import { q } from "@/lib/db/pool";
/** Har muhim harakat izi — keyin maktab/davlat hisoboti shu jadvaldan chiqadi. */
export async function track(userId: number | null, type: string, payload: unknown = {}) {
  try {
    await q(`INSERT INTO events (user_id, type, payload) VALUES ($1,$2,$3)`,
      [userId, type, JSON.stringify(payload)]);
  } catch {
    /* analitika hech qachon asosiy oqimni to'xtatmasin */
  }
}
