import { Pool } from "pg";
import { env } from "@/lib/config/env";

declare global { var __pgPool: Pool | undefined; }

export function pool(): Pool {
  if (!global.__pgPool) {
    global.__pgPool = new Pool({
      connectionString: env.databaseUrl(),
      ssl: process.env.PGSSL === "off" ? undefined : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return global.__pgPool;
}

export async function q<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await pool().query(text, params);
  return res.rows as T[];
}

export async function one<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Tranzaksiya: ichidagi barcha so'rovlar BITTA ulanishda ketadi.
 * Xato bo'lsa — hammasi qaytariladi (ROLLBACK). Do'kondagi tanga yechish uchun shart:
 * balans tekshiruvi va yechish orasida boshqa so'rov kirib qolmasin.
 */
export async function tx<T>(fn: (c: { q: typeof q; one: typeof one }) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  const cq = async <R = any>(text: string, params: any[] = []): Promise<R[]> =>
    (await client.query(text, params)).rows as R[];
  const cone = async <R = any>(text: string, params: any[] = []): Promise<R | null> =>
    (await cq<R>(text, params))[0] ?? null;
  try {
    await client.query("BEGIN");
    const out = await fn({ q: cq as typeof q, one: cone as typeof one });
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
