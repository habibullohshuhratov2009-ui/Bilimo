"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import CountUp from "@/components/app/CountUp";
import "@/components/app/fx.css";
import Coin from "@/components/ui/Coin";
import Spinner from "@/components/ui/Spinner";
import { copyText } from "@/components/ui/CopyButton";

type Me = {
  ok: boolean;
  user: { id: number; nickname: string; name?: string; role: string; class_id: number | null; grade: number | null };
  coins: number;
  class: { name: string; code: string } | null;
  topic: { id: number; title: string; subject: string | null } | null;
  leaderboard: { nickname: string; name?: string; coins: number | string; streak: number | string }[];
};

const MEDALS = ["🥇", "🥈", "🥉"];

const delay = (ms: number) => ({ "--fx-delay": `${ms}ms` }) as CSSProperties;

const ONB_KEY = "bilimo_onb_v1";
const ONB_STEPS = [
  { icon: "💬", title: "Savolingni yoz", text: "Uy vazifangdagi savolni yoz — Bilimo javobni bermaydi, qadam-baqadam TUSHUNTIRADI." },
  { icon: "🪙", title: "Mini-test ishla", text: "Har tushuntirishdan keyin kichik test chiqadi. To'g'ri javob = tanga." },
  { icon: "⚔️", title: "Do'stingni chaqir", text: "Tangalar sinf reytingiga yoziladi. Sinfdoshingni duelga chaqir va kim zo'rligini ko'rsat." },
];

function Onboarding({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const last = step === ONB_STEPS.length - 1;
  const s = ONB_STEPS[step];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6 sm:items-center sm:pb-0">
      <div className="fx-rise w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div className="text-4xl">{s.icon}</div>
        <h2 className="mt-3 text-xl font-extrabold">{s.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{s.text}</p>
        <div className="mt-5 flex items-center justify-center gap-1.5">
          {ONB_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-[#4F46E5]" : "w-2 bg-[#CBD5E1]"}`}
            />
          ))}
        </div>
        <button
          onClick={() => (last ? onClose() : setStep(step + 1))}
          className="mt-5 h-12 w-full rounded-2xl bg-[#4F46E5] text-base font-extrabold text-white transition-transform active:scale-[0.98]"
        >
          {last ? "Boshladik! 🚀" : "Keyingisi"}
        </button>
        {!last && (
          <button onClick={onClose} className="mt-2 h-11 w-full text-sm font-semibold text-[#94A3B8]">
            O'tkazib yuborish
          </button>
        )}
      </div>
    </div>
  );
}

export default function PanelPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showOnb, setShowOnb] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONB_KEY)) setShowOnb(true);
    } catch {
      /* localStorage yopiq bo'lsa — onboarding shunchaki ko'rsatilmaydi */
    }
  }, []);

  function closeOnb() {
    setShowOnb(false);
    try {
      localStorage.setItem(ONB_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    fetch("/api/me")
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/kirish");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.ok) setMe(data);
        else setError(data.error ?? "Ma'lumot yuklanmadi");
      })
      .catch(() => setError("Server bilan aloqa uzildi. Sahifani yangilang."));
  }, [router]);

  async function inviteFriend() {
    if (!me) return;
    const link = `${location.origin}/kirish?invite=${encodeURIComponent(me.user.nickname.toUpperCase())}`;
    await copyText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/kirish");
  }

  if (error) {
    return (
      <main className="min-h-dvh bg-[#F8FAFC] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-6">
          <div className="text-4xl mb-2">😕</div>
          <p className="font-semibold text-[#DC2626]">{error}</p>
        </Card>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-dvh bg-[#F8FAFC] flex items-center justify-center">
        <Spinner size={36} />
      </main>
    );
  }

  const myStreak = Number(
    me.leaderboard.find((r) => r.nickname === me.user.nickname)?.streak ?? 0
  );

  return (
    <main className="min-h-dvh bg-[#F8FAFC] text-[#0F172A] px-4 py-6">
      {showOnb && <Onboarding onClose={closeOnb} />}
      <div className="max-w-md mx-auto flex flex-col gap-4">
        <header className="fx-rise flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Salom, {me.user.name ?? me.user.nickname}! 👋</h1>
            {me.class && (
              <p className="text-sm text-[#64748B] mt-0.5">
                {me.class.name} · kod: <span className="font-mono font-bold">{me.class.code}</span>
              </p>
            )}
          </div>
          <button onClick={logout} className="text-sm text-[#94A3B8] hover:text-[#DC2626] font-semibold">
            Chiqish
          </button>
        </header>

        <Card className="fx-rise bg-gradient-to-br from-[#4F46E5] to-[#6D28D9] text-white border-0 p-5" style={delay(60)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm font-semibold">Tangalarim</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="fx-coin-spin"><Coin size={40} /></span>
                <CountUp value={Number(me.coins)} duration={1100} className="text-5xl font-extrabold" />
              </div>
            </div>
            <div className="text-center bg-white/15 rounded-2xl px-4 py-3">
              <div className="text-3xl fx-flame">🔥</div>
              <CountUp value={myStreak} duration={900} className="block text-2xl font-extrabold" />
              <div className="text-xs text-indigo-200 font-semibold">kun streak</div>
            </div>
          </div>
        </Card>

        <Card className="fx-rise flex items-center gap-3" style={delay(120)}>
          <div className="text-3xl">📚</div>
          <div>
            <p className="text-xs font-semibold text-[#64748B]">Bugungi mavzu</p>
            <p className="font-bold">
              {me.topic ? me.topic.title : "Mavzu hali belgilanmagan"}
              {me.topic?.subject ? <span className="text-[#64748B] font-semibold"> · {me.topic.subject}</span> : null}
            </p>
          </div>
        </Card>

        <div className="fx-rise flex flex-col gap-3" style={delay(180)}>
          <Link
            href="/yechish"
            className="min-h-14 rounded-2xl bg-[#4F46E5] text-white font-bold text-lg flex items-center justify-center gap-2 shadow-[0_4px_0_#3730A3] active:shadow-none active:translate-y-1 active:scale-[0.98] transition-all hover:bg-[#4338CA]"
          >
            🧠 Masala yechish
          </Link>
          <Link
            href="/duel"
            className="min-h-14 rounded-2xl bg-[#FACC15] text-[#0F172A] font-bold text-lg flex items-center justify-center gap-2 shadow-[0_4px_0_#CA8A04] active:shadow-none active:translate-y-1 active:scale-[0.98] transition-all hover:bg-[#EAB308]"
          >
            ⚔️ Duelga chaqirish
          </Link>
          <button
            onClick={inviteFriend}
            className={`fx-press min-h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-colors border-2 active:scale-[0.98] ${
              copied
                ? "bg-[#16A34A] border-[#16A34A] text-white"
                : "bg-white border-[#4F46E5] text-[#4F46E5] hover:bg-indigo-50"
            }`}
          >
            {copied ? "Havola nusxalandi ✓" : "🤝 Do'stni chaqir (+30 tanga)"}
          </button>
        </div>

        <Card className="fx-rise" style={delay(240)}>
          <h2 className="font-extrabold text-lg mb-3">🏆 Sinf reytingi</h2>
          {me.leaderboard.length === 0 ? (
            <p className="text-sm text-[#64748B]">Hozircha reyting bo'sh — birinchi bo'l!</p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {me.leaderboard.slice(0, 10).map((row, i) => {
                const isMe = row.nickname === me.user.nickname;
                return (
                  <li
                    key={row.nickname}
                    style={delay(320 + i * 50)}
                    className={`fx-rise flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
                      isMe ? "bg-indigo-50 border-2 border-[#4F46E5]/30" : "bg-slate-50"
                    }`}
                  >
                    <span className="w-8 text-center text-lg font-extrabold">
                      {i < 3 ? (
                        <span className="fx-medal" style={delay(i * 260)}>{MEDALS[i]}</span>
                      ) : (
                        <span className="text-[#94A3B8] text-sm">{i + 1}</span>
                      )}
                    </span>
                    <span className="flex-1 font-bold truncate">
                      {row.name ?? row.nickname}
                      {isMe && <span className="text-[#4F46E5] text-xs font-extrabold ml-1">(sen)</span>}
                    </span>
                    <span className="flex items-center gap-1 font-extrabold tabular-nums">
                      <Coin size={18} /> {Number(row.coins)}
                    </span>
                    <span className="text-sm text-[#64748B] font-semibold tabular-nums w-12 text-right">
                      🔥{Number(row.streak)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </div>
    </main>
  );
}
