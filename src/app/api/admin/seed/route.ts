import { NextResponse } from "next/server";
import { migrate } from "@/lib/db/migrate";
import { seedDemo } from "@/lib/db/seed";
export const dynamic = "force-dynamic";

/** Faqat SEED_TOKEN bilan. Demo ma'lumotni bir marta joylash uchun. */
export async function POST(req: Request) {
  const token = process.env.SEED_TOKEN;
  if (!token || req.headers.get("x-seed-token") !== token)
    return NextResponse.json({ ok: false, error: "Ruxsat yo'q" }, { status: 403 });
  await migrate();
  const res = await seedDemo();
  return NextResponse.json({ ok: true, ...res });
}
