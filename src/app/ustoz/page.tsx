"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Coin from "@/components/ui/Coin";
import { copyText } from "@/components/ui/CopyButton";
import CopyButton from "@/components/ui/CopyButton";
import CountUp from "@/components/app/CountUp";
import Toast from "@/components/app/Toast";
import "@/components/app/fx.css";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";

type Student = {
  id: number;
  nickname: string;
  name?: string;
  coins: number | string;
  streak: number | string;
  attempts: number | string;
  correct: number | string;
  total?: number | string;
};

type ClassData = {
  ok: boolean;
  error?: string;
  class: { id: number; name: string; code: string };
  students: Student[];
  topic: { title: string; subject: string | null } | null;
};

const delay = (ms: number) => ({ "--fx-delay": `${ms}ms` }) as CSSProperties;

export default function UstozPage() {
  const router = useRouter();
  const [data, setData] = useState<ClassData | null>(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [resetInfo, setResetInfo] = useState<{ student: string; pin: string } | null>(null);
  const [resetBusy, setResetBusy] = useState<number | null>(null);
  const [aiReport, setAiReport] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  async function askAi() {
    setAiBusy(true);
    setAiError("");
    try {
      const res = await fetch("/api/teacher/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Xatolik");
      setAiReport(String(j.report || ""));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setAiBusy(false);
    }
  }

  async function copyClassCode(code: string) {
    await copyText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2200);
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/class");
      if (res.status === 401 || res.status === 403) {
        router.replace("/kirish?role=teacher");
        return;
      }
      const d: ClassData = await res.json();
      if (d.ok) setData(d);
      else setError(d.error ?? "Ma'lumot yuklanmadi");
    } catch {
      setError("Server bilan aloqa uzildi. Sahifani yangilang.");
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveTopic() {
    setFormError("");
    if (!title.trim()) {
      setFormError("Mavzu nomini yozing");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/teacher/topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), subject: subject.trim() || undefined }),
      });
      const d = await res.json();
      if (!d.ok) {
        setFormError(d.error ?? "Saqlanmadi");
        return;
      }
      setTitle("");
      setSubject("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
    } catch {
      setFormError("Server bilan aloqa uzildi");
    } finally {
      setSaving(false);
    }
  }

  async function resetPin(st: Student) {
    const label = st.name ?? st.nickname;
    if (!confirm(`${label} uchun YANGI PIN yaratilsinmi? Eski PIN ishlamay qoladi.`)) return;
    setResetBusy(st.id);
    try {
      const res = await fetch("/api/teacher/reset-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: st.id }),
      });
      const d = await res.json();
      if (d.ok) setResetInfo({ student: d.student, pin: d.pin });
      else alert(d.error ?? "Tiklanmadi");
    } catch {
      alert("Server bilan aloqa uzildi");
    } finally {
      setResetBusy(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/kirish?role=teacher");
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

  if (!data) {
    return (
      <main className="min-h-dvh bg-[#F8FAFC] flex items-center justify-center">
        <Spinner size={36} />
      </main>
    );
  }

  const students = data.students ?? [];
  const totalAttempts = students.reduce((s, x) => s + Number(x.attempts || 0), 0);
  const totalCorrect = students.reduce((s, x) => s + Number(x.correct || 0), 0);
  const totalQuestions = students.reduce((s, x) => s + Number(x.total || 0), 0);
  const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <main className="min-h-dvh bg-[#F8FAFC] text-[#0F172A] px-4 py-6">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        <header className="fx-rise flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#64748B]">👩‍🏫 O'qituvchi paneli</p>
            <h1 className="text-2xl font-extrabold">{data.class.name}</h1>
          </div>
          <button onClick={logout} className="text-sm text-[#94A3B8] hover:text-[#DC2626] font-semibold">
            Chiqish
          </button>
        </header>

        <Card className="fx-rise p-5 text-center bg-gradient-to-br from-[#4F46E5] to-[#6D28D9] text-white border-0" style={delay(60)}>
          <p className="text-indigo-200 text-sm font-semibold mb-2">
            Sinf kodi — o'quvchilar shu kod bilan qo'shiladi:
          </p>
          <button
            onClick={() => copyClassCode(data.class.code)}
            title="Bosib nusxalash"
            className="fx-press w-full text-5xl font-extrabold tracking-[0.25em] bg-white/15 rounded-2xl py-4 mb-3 select-all hover:bg-white/20 transition-colors"
          >
            {data.class.code}
          </button>
          <CopyButton
            text={data.class.code}
            label="Kodni nusxalash 📋"
            className="w-full !bg-transparent !border-white !text-white hover:!bg-white/10"
          />
        </Card>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["🧒", students.length, "o'quvchi"],
              ["📝", totalAttempts, "urinish"],
              ["✅", accuracy, "to'g'ri javob, %"],
            ] as [string, number, string][]
          ).map(([emoji, num, label], i) => (
            <Card key={label} className="fx-rise text-center py-4 px-2" style={delay(120 + i * 60)}>
              <div className="text-xl">{emoji}</div>
              <span className="flex items-baseline justify-center">
                <CountUp
                  value={num}
                  duration={1000}
                  decimals={0}
                  className="text-2xl font-extrabold"
                />
                {label.endsWith("%") ? (
                  <span className="text-2xl font-extrabold">%</span>
                ) : null}
              </span>
              <div className="text-[11px] font-semibold text-[#64748B]">{label}</div>
            </Card>
          ))}
        </div>

        <Card className="fx-rise p-5" style={delay(200)}>
          <h2 className="font-extrabold text-lg mb-1">🤖 AI hisobot</h2>
          <p className="text-sm text-[#64748B] mb-3">
            Sinf statistikasini AI o'qib beradi: kim orqada qolyapti, kim zo'r ketyapti, ertaga nima qilish kerak.
          </p>
          <Button onClick={askAi} disabled={aiBusy} className="w-full">
            {aiBusy ? "AI o'qiyapti…" : "Sinf holatini tahlil qil"}
          </Button>
          {aiError && (
            <div className="fx-shake mt-3 rounded-2xl bg-red-50 border-2 border-[#DC2626]/30 text-[#DC2626] px-4 py-3 text-sm font-semibold">
              {aiError}
            </div>
          )}
          {aiReport && (
            <div className="fx-rise mt-3 whitespace-pre-wrap rounded-2xl bg-[#F1F5F9] px-4 py-3 text-sm leading-relaxed text-[#0F172A]">
              {aiReport}
            </div>
          )}
        </Card>

        <Card className="fx-rise p-5" style={delay(240)}>
          <h2 className="font-extrabold text-lg mb-1">📚 Bugungi mavzu</h2>
          <p className="text-sm text-[#64748B] mb-3">
            Hozirgi:{" "}
            <span className="font-bold text-[#0F172A]">
              {data.topic ? data.topic.title : "belgilanmagan"}
            </span>
            {data.topic?.subject ? ` (${data.topic.subject})` : ""}
          </p>
          <div className="flex flex-col gap-3">
            <Input
              label="Yangi mavzu"
              placeholder="masalan: Kasrlarni qo'shish"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Fan (ixtiyoriy)"
              placeholder="masalan: Matematika"
              value={subject}
              maxLength={60}
              onChange={(e) => setSubject(e.target.value)}
            />
            {formError && (
              <div key={formError} className="fx-shake rounded-2xl bg-red-50 border-2 border-[#DC2626]/30 text-[#DC2626] px-4 py-3 text-sm font-semibold">
                ⚠️ {formError}
              </div>
            )}
            <Button
              variant={saved ? "success" : "primary"}
              disabled={saving}
              onClick={saveTopic}
              className="flex items-center justify-center gap-2"
            >
              {saving ? <Spinner size={20} /> : saved ? "Saqlandi ✓" : "Mavzuni saqlash"}
            </Button>
          </div>
        </Card>

        {resetInfo && (
          <Card className="fx-rise p-5 border-2 border-[#16A34A] bg-green-50">
            <h2 className="font-extrabold text-lg mb-1">🔑 Yangi PIN tayyor</h2>
            <p className="text-sm text-[#334155]">
              <b>{resetInfo.student}</b> uchun yangi PIN (bir marta ko'rsatiladi — o'quvchiga ayting):
            </p>
            <div className="text-4xl font-extrabold tracking-[0.3em] text-center my-3 select-all">
              {resetInfo.pin}
            </div>
            <Button variant="success" onClick={() => setResetInfo(null)} className="w-full">
              Aytdim, yopish ✓
            </Button>
          </Card>
        )}

        <Card className="fx-rise p-4" style={delay(300)}>
          <h2 className="font-extrabold text-lg mb-3 px-1">🧑‍🎓 O'quvchilar</h2>
          {students.length === 0 ? (
            <p className="text-sm text-[#64748B] px-1 pb-2">
              Hali o'quvchi yo'q — sinf kodini ulashing, ular ro'yxatdan o'tadi.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold text-[#94A3B8] uppercase">
                    <th className="px-2 py-2">#</th>
                    <th className="px-2 py-2">Ism familiya</th>
                    <th className="px-2 py-2 text-right">Tanga</th>
                    <th className="px-2 py-2 text-right">🔥</th>
                    <th className="px-2 py-2 text-right">Urinish</th>
                    <th className="px-2 py-2 text-right">To'g'ri</th>
                    <th className="px-2 py-2 text-right">PIN</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`fx-rise ${i % 2 ? "bg-slate-50" : ""}`}
                      style={delay(360 + Math.min(i * 45, 540))}
                    >
                      <td className="px-2 py-2.5 font-bold text-[#94A3B8]">
                        {i < 3 ? <span className="fx-medal" style={delay(i * 260)}>{["🥇", "🥈", "🥉"][i]}</span> : i + 1}
                      </td>
                      <td className="px-2 py-2.5 font-bold">{s.name ?? s.nickname}</td>
                      <td className="px-2 py-2.5 text-right font-extrabold tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Coin size={14} /> {Number(s.coins)}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{Number(s.streak)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{Number(s.attempts)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums text-[#16A34A] font-bold">
                        {Number(s.correct)}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <button
                          onClick={() => resetPin(s)}
                          disabled={resetBusy === s.id}
                          title="PIN esdan chiqqan bo'lsa — yangi PIN yaratish"
                          className="text-xs font-bold text-[#4F46E5] border-2 border-[#4F46E5]/30 rounded-xl px-2 py-1 hover:bg-indigo-50 disabled:opacity-50"
                        >
                          {resetBusy === s.id ? "..." : "🔑 Tiklash"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      <Toast show={codeCopied}>✓ Sinf kodi nusxalandi</Toast>
    </main>
  );
}
