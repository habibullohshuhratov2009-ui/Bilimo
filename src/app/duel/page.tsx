"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Coin from "@/components/ui/Coin";
import CopyButton from "@/components/ui/CopyButton";
import Spinner from "@/components/ui/Spinner";

type Question = { q: string; options: string[]; correct: number; why?: string };
type Phase = "menu" | "creating" | "created" | "joining" | "play" | "finishing" | "done";

const TIME_PER_Q = 15;

export default function DuelPage() {
  const router = useRouter();
  const [myId, setMyId] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [remaining, setRemaining] = useState(TIME_PER_Q);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const answersRef = useRef<(number | null)[]>([]);

  useEffect(() => {
    fetch("/api/me")
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/kirish");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.ok) setMyId(d.user.id);
      })
      .catch(() => setError("Server bilan aloqa uzildi"));
  }, [router]);

  // Timer
  useEffect(() => {
    if (phase !== "play" || picked !== null) return;
    if (remaining <= 0) {
      advance(null);
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 0.1), 100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, remaining, picked]);

  function startPlay(qs: Question[]) {
    answersRef.current = [];
    setQuestions(qs);
    setQIndex(0);
    setRemaining(TIME_PER_Q);
    setPicked(null);
    setScore(0);
    setPhase("play");
  }

  function advance(answer: number | null) {
    const list = [...answersRef.current, answer];
    answersRef.current = list;
    if (list.length >= questions.length) {
      const sc = list.filter((a, i) => a !== null && a === questions[i].correct).length;
      setScore(sc);
      finish(sc);
    } else {
      setQIndex(list.length);
      setRemaining(TIME_PER_Q);
      setPicked(null);
    }
  }

  function pick(oi: number) {
    if (picked !== null) return;
    setPicked(oi);
    setTimeout(() => advance(oi), 500);
  }

  async function createDuel() {
    setError("");
    setPhase("creating");
    try {
      const res = await fetch("/api/duel/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Duel yaratilmadi");
        setPhase("menu");
        return;
      }
      setCode(data.code);
      setQuestions(data.questions ?? []);
      setPhase("created");
    } catch {
      setError("Server bilan aloqa uzildi. Qayta urinib ko'r.");
      setPhase("menu");
    }
  }

  async function joinDuel() {
    setError("");
    const c = joinCode.trim().toUpperCase();
    if (c.length < 4) {
      setError("Duel kodini kirit (do'sting yuborgan)");
      return;
    }
    setPhase("joining");
    try {
      const res = await fetch("/api/duel/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Qo'shilib bo'lmadi");
        setPhase("menu");
        return;
      }
      setCode(c);
      startPlay(data.questions ?? []);
    } catch {
      setError("Server bilan aloqa uzildi. Qayta urinib ko'r.");
      setPhase("menu");
    }
  }

  async function finish(sc: number) {
    setPhase("finishing");
    try {
      const res = await fetch("/api/duel/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, score: sc }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Natija saqlanmadi");
        setPhase("done");
        return;
      }
      setWinnerId(data.winnerId ?? null);
      setBalance(Number(data.balance ?? 0));
      setPhase("done");
    } catch {
      setError("Server bilan aloqa uzildi — natija saqlanmagan bo'lishi mumkin.");
      setPhase("done");
    }
  }

  function reset() {
    setPhase("menu");
    setError("");
    setCode("");
    setJoinCode("");
    setQuestions([]);
    setWinnerId(null);
    setBalance(null);
  }

  const q = questions[qIndex];
  const pct = Math.max(0, (remaining / TIME_PER_Q) * 100);
  const barColor = remaining > 8 ? "bg-[#16A34A]" : remaining > 4 ? "bg-[#FACC15]" : "bg-[#DC2626]";

  return (
    <main className="min-h-dvh bg-[#F8FAFC] text-[#0F172A] px-4 py-6">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        <header className="flex items-center gap-3">
          <Link href="/panel" className="text-[#4F46E5] font-bold text-sm">
            ← Panel
          </Link>
          <h1 className="text-xl font-extrabold">⚔️ 1x1 Duel</h1>
        </header>

        {error && phase !== "done" && (
          <div className="rounded-2xl bg-red-50 border-2 border-[#DC2626]/30 text-[#DC2626] px-4 py-3 text-sm font-semibold">
            ⚠️ {error}
          </div>
        )}

        {phase === "menu" && (
          <>
            <Card className="p-5 text-center">
              <div className="text-4xl mb-2">🆕</div>
              <h2 className="font-extrabold text-lg mb-1">Duel yaratish</h2>
              <p className="text-sm text-[#64748B] mb-4">
                Kod olasan → do'stingga yuborasan → kim ko'proq to'g'ri yechsa, o'sha yutadi. G'olibga +25 tanga!
              </p>
              <Button big onClick={createDuel} className="w-full">
                Duel yaratish ⚡
              </Button>
            </Card>

            <Card className="p-5 text-center">
              <div className="text-4xl mb-2">🎯</div>
              <h2 className="font-extrabold text-lg mb-1">Kod bilan qo'shilish</h2>
              <p className="text-sm text-[#64748B] mb-3">Do'sting yuborgan kodni kirit:</p>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="MASALAN: K7ZP2"
                maxLength={8}
                className="w-full min-h-12 px-4 rounded-2xl border-2 border-slate-200 bg-white text-center text-xl font-extrabold tracking-[0.3em] uppercase outline-none focus:border-[#4F46E5] placeholder:text-slate-300 placeholder:tracking-normal placeholder:text-sm mb-3"
              />
              <Button variant="yellow" big onClick={joinDuel} className="w-full">
                Qo'shilish 🚀
              </Button>
            </Card>
          </>
        )}

        {(phase === "creating" || phase === "joining") && (
          <Card className="p-8 text-center">
            <div className="text-5xl animate-bounce mb-3">⚔️</div>
            <Spinner size={30} />
            <p className="font-bold text-[#4F46E5] mt-3">
              {phase === "creating" ? "AI savollar tuzyapti…" : "Duelga qo'shilyapmiz…"}
            </p>
          </Card>
        )}

        {phase === "created" && (
          <Card className="p-6 text-center">
            <p className="font-bold text-[#64748B] text-sm mb-2">Duel kodi — do'stingga yubor:</p>
            <div className="text-5xl font-extrabold tracking-[0.25em] text-[#4F46E5] bg-indigo-50 rounded-2xl py-5 mb-3 select-all">
              {code}
            </div>
            <CopyButton text={code} label="Kodni nusxalash 📋" className="w-full mb-3" />
            <p className="text-xs text-[#94A3B8] mb-4">
              Do'sting «Kod bilan qo'shilish» orqali kiradi. Sen hoziroq boshlashing mumkin!
            </p>
            <Button big variant="success" onClick={() => startPlay(questions)} className="w-full">
              Boshlash ▶
            </Button>
          </Card>
        )}

        {phase === "play" && q && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-extrabold text-[#64748B]">
                Savol {qIndex + 1} / {questions.length}
              </span>
              <span
                className={`text-lg font-extrabold tabular-nums ${remaining <= 5 ? "text-[#DC2626]" : "text-[#0F172A]"}`}
              >
                ⏱ {Math.ceil(remaining)}s
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-[width] duration-100 ease-linear ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="font-bold text-lg mb-4">{q.q}</p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => pick(oi)}
                  disabled={picked !== null}
                  className={`min-h-12 px-4 py-2.5 rounded-2xl border-2 text-left text-[15px] transition-colors ${
                    picked === oi
                      ? "border-[#4F46E5] bg-[#4F46E5] text-white font-bold"
                      : "border-slate-200 bg-white hover:border-[#4F46E5]/50"
                  }`}
                >
                  <span className="font-extrabold mr-2">{"ABCD"[oi]}.</span>
                  {opt}
                </button>
              ))}
            </div>
          </Card>
        )}

        {phase === "finishing" && (
          <Card className="p-8 text-center">
            <Spinner size={30} />
            <p className="font-bold text-[#4F46E5] mt-3">Natija hisoblanyapti…</p>
          </Card>
        )}

        {phase === "done" && (
          <Card className="p-6 text-center">
            <div className="text-6xl mb-3">
              {winnerId !== null && winnerId === myId ? "🏆" : winnerId === null ? "⏳" : "😅"}
            </div>
            <h2 className="text-2xl font-extrabold mb-1">
              {winnerId !== null && winnerId === myId
                ? "Yutding!"
                : winnerId === null
                  ? "Natijang qabul qilindi!"
                  : "Bu safar yutqazding"}
            </h2>
            <p className="text-[#64748B] font-semibold mb-3">
              Balling: {score} / {questions.length}
              {winnerId === null && " · Raqib tugatgach g'olib aniqlanadi (teng bo'lsa — durang)"}
            </p>
            <div className="flex items-center justify-center gap-2 font-extrabold text-lg mb-1">
              <Coin size={22} /> +5 o'yin uchun
              {winnerId !== null && winnerId === myId && <span className="text-[#16A34A]">+25 g'alaba!</span>}
            </div>
            {balance !== null && <p className="text-sm text-[#94A3B8] mb-4">Jami: {balance} tanga</p>}
            {error && (
              <div className="rounded-2xl bg-red-50 border-2 border-[#DC2626]/30 text-[#DC2626] px-4 py-3 text-sm font-semibold mb-3">
                ⚠️ {error}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button big variant="yellow" onClick={reset}>
                Yana duel ⚔️
              </Button>
              <Link
                href="/panel"
                className="min-h-12 rounded-2xl border-2 border-[#4F46E5] text-[#4F46E5] font-bold flex items-center justify-center hover:bg-indigo-50 transition-colors"
              >
                Panelga qaytish
              </Link>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
