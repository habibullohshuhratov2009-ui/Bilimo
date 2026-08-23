import { NextResponse } from "next/server";
import { migrate } from "@/lib/db/migrate";
import { one } from "@/lib/db/pool";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await migrate();
    const row = await one<{ now: string }>("SELECT now() AS now");
    return NextResponse.json({ ok: true, db: row?.now ?? null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
