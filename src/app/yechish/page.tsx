"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Coin from "@/components/ui/Coin";
import Confetti from "@/components/app/Confetti";
import CountUp from "@/components/app/CountUp";
import "@/components/app/fx.css";

type Question = { q: string; options: string[] };
type ReviewItem = { correct: number; why: string };
type SolveResp = { ok: boolean; error?: string; explanation?: string; quizId?: number | null; questions?: Question[] };
type SubmitResp = { ok: boolean; error?: string; correct: number; total: number; coins: number; balance: number; review?: ReviewItem[] };

type Phase = "input" | "loading" | "result" | "checked";

const delay = (ms: number) => ({ "--fx-delay": `${ms}ms` }) as CSSProperties;

const WAIT_MSGS = [
  "AI masalani o'qiyapti… 👀",
  "Chuqur o'ylayapti… 🤔",
  "Formulalarni eslayapti… 🧮",
  "Tushuntirish yozilyapti… ✍️",
  "Test savollari tuzilyapti… 📝",
];

function cleanLine(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`/g, "")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*]\s+/, "• ");
}

export default function YechishPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("input");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");
  const [quizId, setQuizId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<SubmitResp | null>(null);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [waitIdx, setWaitIdx] = useState(0);
  const startTs = useRef(0);

  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => setWaitIdx((i) => (i + 1) % WAIT_MSGS.length), 2200);
    return () => clearInterval(t);
  }, [phase]);

  async function solve() {
    setError("");
    if (text.trim().length < 3) {
      setError("Avval savolingni yoz 🙂");
      return;
    }
    setPhase("loading");
    setWaitIdx(0);
    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (res.status === 401) {
        router.replace("/kirish");
        return;
      }
      const data: SolveResp = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Xatolik yuz berdi. Qayta urinib ko'r.");
        setPhase("input");
        return;
      }
      setExplanation(data.explanation ?? "");
      setQuizId(data.quizId ?? null);
      setQuestions(data.questions ?? []);
      setAnswers(new Array((data.questions ?? []).length).fill(null));
      startTs.current = Date.now();
      setPhase("result");
    } catch {
      setError("Server bilan aloqa uzildi. Qayta urinib ko'r.");
      setPhase("input");
    }
  }

  async function check() {
    if (!quizId) return;
    setError("");
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers, durationMs: Date.now() - startTs.current }),
      });
      const data: SubmitResp = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Tekshirishda xatolik");
        return;
      }
      setResult(data);
      setReview(data.review ?? []);
      setPhase("checked");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Server bilan aloqa uzildi. Qayta urinib ko'r.");
    }
  }

  function reset() {
    setPhase("input");
    setText("");
    setError("");
    setExplanation("");
    setQuizId(null);
    setQuestions([]);
    setAnswers([]);
    setResult(null);
    setReview([]);
  }

  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);

  return (
    <main className="min-h-dvh bg-[#F8FAFC] text-[#0F172A] px-4 py-6">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        <header className="flex items-center gap-3">
          <Link href="/panel" className="text-[#4F46E5] font-bold text-sm">
            ← Panel
          </Link>
          <h1 className="text-xl font-extrabold">🧠 Masala yechish</h1>
        </header>

        {phase === "input" && (
          <Card className="fx-rise p-5 flex flex-col gap-3">
            <label className="block">
              <span className="block text-sm font-semibold text-[#334155] mb-1.5">
                Savolingni yoz yoki masalani ko'chir
              </span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                maxLength={2000}
                placeholder="Masalan: 3x + 5 = 20 bo'lsa, x nechaga teng? Yoki: Fotosintez nima?"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-white text-base outline-none transition-colors focus:border-[#4F46E5] placeholder:text-slate-400 resize-none"
              />
            </label>
            {error && (
              <div key={error} className="fx-shake rounded-2xl bg-red-50 border-2 border-[#DC2626]/30 text-[#DC2626] px-4 py-3 text-sm font-semibold">
                ⚠️ {error}
              </div>
            )}
            <Button big onClick={solve} disabled={text.trim().length < 3}>
              Tushuntir ✨
            </Button>
          </Card>
        )}

        {phase === "loading" && (
          <Card className="fx-rise p-6">
            <div className="text-center mb-5">
              <div className="text-5xl animate-bounce">🤖</div>
              <p key={waitIdx} className="fx-fade-up font-bold text-[#4F46E5] mt-3">
                {WAIT_MSGS[waitIdx]}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-3" aria-hidden>
                <span className="fx-dot" />
                <span className="fx-dot" style={delay(150)} />
                <span className="fx-dot" style={delay(300)} />
              </div>
            </div>
            <div className="flex flex-col gap-2.5 animate-pulse">
              {["w-full", "w-11/12", "w-4/5", "w-full", "w-2/3"].map((w, i) => (
                <div key={i} className={`fx-rise h-4 bg-slate-200 rounded-full ${w}`} style={delay(i * 70)} />
              ))}
            </div>
          </Card>
        )}

        {(phase === "result" || phase === "checked") && (
          <>
            {phase === "checked" && result && result.correct === result.total && <Confetti />}
            {phase === "checked" && result && (
              <Card className="fx-rise text-center p-6 bg-gradient-to-br from-[#4F46E5] to-[#6D28D9] text-white border-0">
                <div className="text-5xl mb-2">
                  <span className="fx-pop-in">
                    {result.correct === result.total ? "🎉" : result.correct > result.total / 2 ? "👏" : "💪"}
                  </span>
                </div>
                <p className="text-3xl font-extrabold">
                  {result.correct} / {result.total} to'g'ri
                </p>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-lg font-bold text-[#FACC15]">
                  <span className="fx-coin-drop"><Coin size={22} /></span> +
                  <CountUp value={result.coins} duration={800} /> tanga
                </p>
                <p className="text-indigo-200 text-sm mt-1">
                  Jami: <CountUp value={Number(result.balance)} duration={1100} /> tanga
                </p>
                <Button variant="yellow" big onClick={reset} className="mt-4 w-full">
                  Yana bitta 🔄
                </Button>
              </Card>
            )}

            <Card className="fx-rise p-5" style={delay(60)}>
              <h2 className="font-extrabold text-lg mb-2">📖 Tushuntirish</h2>
              <div className="flex flex-col gap-2">
                {explanation.split("\n").map((line, i) =>
                  line.trim() ? (
                    <p
                      key={i}
                      className="fx-rise text-[15px] leading-relaxed whitespace-pre-wrap"
                      style={delay(120 + Math.min(i, 8) * 70)}
                    >
                      {cleanLine(line)}
                    </p>
                  ) : null
                )}
              </div>
            </Card>

            {questions.length > 0 && (
              <Card className="fx-rise p-5" style={delay(180)}>
                <h2 className="font-extrabold text-lg mb-3">
                  📝 Mini-test {phase === "checked" ? "— natijalar" : "— o'zingni sina!"}
                </h2>
                <div className="flex flex-col gap-5">
                  {questions.map((qq, qi) => (
                    <div key={qi}>
                      <p className="font-bold mb-2">
                        {qi + 1}. {qq.q}
                      </p>
                      <div className="flex flex-col gap-2">
                        {qq.options.map((opt, oi) => {
                          const picked = answers[qi] === oi;
                          let cls = "border-slate-200 bg-white hover:border-[#4F46E5]/50";
                          if (phase === "checked") {
                            if (oi === review[qi]?.correct)
                              cls = "fx-pop border-[#16A34A] bg-green-50 text-[#16A34A] font-bold";
                            else if (picked) cls = "fx-shake border-[#DC2626] bg-red-50 text-[#DC2626]";
                            else cls = "border-slate-200 bg-white opacity-60";
                          } else if (picked) {
                            cls = "fx-pop border-[#4F46E5] bg-indigo-50 font-bold";
                          }
                          return (
                            <button
                              key={oi}
                              disabled={phase === "checked"}
                              onClick={() =>
                                setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
                              }
                              className={`fx-opt min-h-12 px-4 py-2.5 rounded-2xl border-2 text-left text-[15px] ${cls}`}
                            >
                              <span className="font-extrabold mr-2">{"ABCD"[oi]}.</span>
                              {opt}
                              {phase === "checked" && oi === review[qi]?.correct && " ✓"}
                            </button>
                          );
                        })}
                      </div>
                      {phase === "checked" && review[qi]?.why && (
                        <p className="fx-fade-up mt-2 text-sm text-[#64748B] bg-slate-50 rounded-2xl px-4 py-2.5">
                          💡 {review[qi]?.why}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {error && (
                  <div key={error} className="fx-shake mt-4 rounded-2xl bg-red-50 border-2 border-[#DC2626]/30 text-[#DC2626] px-4 py-3 text-sm font-semibold">
                    ⚠️ {error}
                  </div>
                )}
                {phase === "result" && (
                  <Button big onClick={check} disabled={!allAnswered} className="mt-5 w-full" variant="success">
                    {allAnswered ? "Tekshirish ✅" : "Hamma savolga javob ber"}
                  </Button>
                )}
              </Card>
            )}

            {phase === "result" && questions.length === 0 && (
              <Button variant="outline" big onClick={reset}>
                Yana bitta savol 🔄
              </Button>
            )}
          </>
        )}
      </div>
    </main>
  );
}
