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
