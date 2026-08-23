import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { currentUser } from "@/lib/auth/session";
import { tx } from "@/lib/db/pool";
import { rateLimit } from "@/lib/security/ratelimit";
import { track } from "@/lib/db/queries/events";

export const dynamic = "force-dynamic";

/** O'quvchiga beriladigan sovrin kodi — o'qituvchi shu kod bo'yicha sovrinni beradi. */
function rewardCode(prefix: string): string {
  const rnd = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix.slice(0, 4).toUpperCase()}-${rnd}`;
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Kirilmagan" }, { status: 401 });
  if (user.role !== "student")
    return NextResponse.json({ ok: false, error: "Faqat o'quvchi uchun" }, { status: 403 });

  const rl = rateLimit(`shop:${user.id}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Biroz kuting" }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const code = String(body?.code ?? "").trim().slice(0, 40);
  if (!code) return NextResponse.json({ ok: false, error: "Sovrin tanlanmadi" }, { status: 400 });

  try {
    const out = await tx(async (c) => {
      // Qatorni bloklaymiz: bir vaqtda ikki marta bosilsa ham bir marta yechiladi.
      const item = await c.one<{ id: number; price: number; stock: number | null }>(
        `SELECT id, price, stock FROM shop_items
          WHERE code = $1 AND is_active = true FOR UPDATE`, [code]);
      if (!item) return { status: 404 as const, error: "Bunday sovrin yo'q" };
      if (item.stock !== null && item.stock <= 0)
        return { status: 409 as const, error: "Sovrin tugadi" };

      const bal = await c.one<{ coins: string }>(
        `SELECT COALESCE(SUM(delta),0) AS coins FROM coin_ledger WHERE user_id = $1`, [user.id]);
      const coins = Number(bal?.coins ?? 0);
      if (coins < item.price)
        return { status: 402 as const, error: "Tanga yetarli emas", coins, need: item.price };

      await c.q(`INSERT INTO coin_ledger (user_id, delta, reason, ref_id) VALUES ($1,$2,'shop',$3)`,
        [user.id, -item.price, item.id]);
      if (item.stock !== null)
        await c.q(`UPDATE shop_items SET stock = stock - 1 WHERE id = $1`, [item.id]);

      const reward = rewardCode(code);
      await c.q(
        `INSERT INTO purchases (user_id, item_id, price, reward_code) VALUES ($1,$2,$3,$4)`,
        [user.id, item.id, item.price, reward]);

      return { status: 200 as const, reward, coins: coins - item.price };
    });

    if (out.status !== 200)
      return NextResponse.json({ ok: false, ...out }, { status: out.status });

    await track(user.id, "shop_buy", { code });
    return NextResponse.json({ ok: true, reward: out.reward, coins: out.coins });
  } catch {
    return NextResponse.json({ ok: false, error: "Sotib olishda xatolik" }, { status: 500 });
  }
}
