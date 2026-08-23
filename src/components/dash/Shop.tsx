import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Coin from "@/components/ui/Coin";
import Spinner from "@/components/ui/Spinner";
import {
  IconBolt,
  IconCheck,
  IconFlame,
  IconMedal,
  IconSparkles,
  IconTarget,
} from "@/components/app/icons";
import { useI18n } from "@/lib/i18n";

type Item = {
  code: string;
  title_uz: string;
  title_ru: string;
  descr_uz: string;
  descr_ru: string;
  price: number;
  icon: string;
  stock: number | null;
};

type Owned = { code: string; reward_code: string; created_at: string };

const ICONS: Record<string, typeof IconBolt> = {
  sparkles: IconSparkles,
  bolt: IconBolt,
  target: IconTarget,
  medal: IconMedal,
  flame: IconFlame,
};

/** O'quvchi do'koni: tangani sovrinlarga almashtirish. */
export default function Shop({ coins, onChanged }: { coins: number; onChanged: () => void }) {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Item[] | null>(null);
  const [owned, setOwned] = useState<Owned[]>([]);
  const [balance, setBalance] = useState(coins);
  const [busy, setBusy] = useState<string | null>(null);
  const [justBought, setJustBought] = useState<{ code: string; reward: string } | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/shop");
      const j = await res.json();
      if (!j.ok) throw new Error(j.error);
      setItems(j.items);
      setOwned(j.owned ?? []);
      setBalance(Number(j.coins ?? 0));
    } catch {
      setError(t("common.error"));
      setItems([]);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function buy(code: string) {
    setBusy(code);
    setError("");
    try {
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error ?? t("common.error"));
        return;
      }
      setBalance(Number(j.coins));
      setJustBought({ code, reward: j.reward });
      await load();
      onChanged();
    } catch {
      setError(t("common.error"));
    } finally {
      setBusy(null);
    }
  }

  if (items === null) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="flex items-center justify-between border-0 bg-gradient-to-br from-[#4F46E5] to-[#6D28D9] p-5 text-white">
        <div>
          <h2 className="text-lg font-extrabold">{t("shop.title")}</h2>
          <p className="mt-0.5 text-sm text-indigo-200">{t("shop.subtitle")}</p>
        </div>
        <div className="shrink-0 rounded-2xl bg-white/15 px-4 py-3 text-center">
          <p className="text-xs font-semibold text-indigo-100">{t("shop.balance")}</p>
          <p className="mt-0.5 flex items-center justify-center gap-1.5 text-2xl font-extrabold">
            <Coin size={22} /> {balance}
          </p>
        </div>
      </Card>

      {error && (
        <div className="rounded-2xl border-2 border-[#DC2626]/30 bg-red-50 px-4 py-3 text-sm font-semibold text-[#DC2626]">
          {error}
        </div>
      )}

      {justBought && (
        <Card className="border-2 border-[#16A34A]/30 bg-[#F0FDF4] p-5">
          <p className="flex items-center gap-2 font-extrabold text-[#15803D]">
            <IconCheck size={20} /> {t("shop.bought")}
          </p>
          <p className="mt-2 text-sm text-[#166534]">{t("shop.rewardHint")}</p>
          <p className="mt-3 select-all rounded-xl bg-white px-4 py-3 text-center font-mono text-xl font-extrabold tracking-widest text-[#15803D]">
            {justBought.reward}
          </p>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => {
          const Icon = ICONS[it.icon] ?? IconMedal;
          const has = owned.some((o) => o.code === it.code);
          const soldOut = it.stock !== null && it.stock <= 0;
          const poor = balance < it.price;
          return (
            <Card key={it.code} className="flex flex-col p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
                <Icon size={22} />
              </span>
              <h3 className="mt-3 font-extrabold leading-snug">{lang === "ru" ? it.title_ru : it.title_uz}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-[#64748B]">
                {lang === "ru" ? it.descr_ru : it.descr_uz}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-lg font-extrabold tabular-nums">
                  <Coin size={20} /> {it.price}
                </span>
                {has ? (
                  <span className="flex items-center gap-1.5 rounded-xl bg-[#DCFCE7] px-3 py-2 text-sm font-extrabold text-[#15803D]">
                    <IconCheck size={16} /> {t("shop.owned")}
                  </span>
                ) : (
                  <button
                    onClick={() => buy(it.code)}
                    disabled={busy === it.code || soldOut || poor}
                    title={poor ? t("shop.needMore", { n: it.price - balance }) : undefined}
                    className="min-h-11 rounded-xl bg-[#4F46E5] px-4 text-sm font-extrabold text-white transition-colors hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
                  >
                    {busy === it.code ? "…" : soldOut ? t("shop.soldOut") : poor ? t("shop.notEnough") : t("shop.buy")}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h3 className="font-extrabold">{t("shop.myRewards")}</h3>
        {owned.length === 0 ? (
          <p className="mt-2 text-sm text-[#64748B]">{t("shop.empty")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {owned.map((o) => {
              const it = items.find((x) => x.code === o.code);
              return (
                <li
                  key={o.reward_code}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <span className="min-w-0 truncate font-bold">
                    {it ? (lang === "ru" ? it.title_ru : it.title_uz) : o.code}
                  </span>
                  <span className="shrink-0 select-all font-mono text-sm font-extrabold tracking-wider text-[#4F46E5]">
                    {o.reward_code}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
