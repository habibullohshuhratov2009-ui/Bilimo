import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { q } from "@/lib/db/pool";
import { balance } from "@/lib/db/queries/coins";

export const dynamic = "force-dynamic";

/** Do'kon ro'yxati + o'quvchining tanga balansi + sotib olganlari. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Kirilmagan" }, { status: 401 });

  const items = await q(
    `SELECT code, title_uz, title_ru, descr_uz, descr_ru, price, icon, stock
       FROM shop_items WHERE is_active = true ORDER BY sort, price`);

  const owned = await q(
    `SELECT s.code, p.reward_code, p.created_at
       FROM purchases p JOIN shop_items s ON s.id = p.item_id
      WHERE p.user_id = $1 ORDER BY p.created_at DESC`, [user.id]);

  return NextResponse.json({ ok: true, coins: await balance(user.id), items, owned });
}
