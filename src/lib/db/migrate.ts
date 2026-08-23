import fs from "node:fs";
import path from "node:path";
import { pool } from "./pool";

/** schema.sql ni ishga tushiradi (idempotent — CREATE TABLE IF NOT EXISTS). */
export async function migrate(): Promise<void> {
  const sql = fs.readFileSync(path.join(process.cwd(), "src/lib/db/schema.sql"), "utf8");
  await pool().query(sql);
}
