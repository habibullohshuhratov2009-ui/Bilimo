"use client";

import { Suspense, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import Mascot from "@/components/app/Mascot";
import "@/components/app/fx.css";

type Tab = "login" | "register";
type Role = "student" | "teacher";

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "Server javob bermadi" }));
  return data as { ok: boolean; error?: string };
}

function KirishInner() {
  const router = useRouter();
  const params = useSearchParams();
  const invite = params.get("invite") ?? "";

  const [tab, setTab] = useState<Tab>(invite ? "register" : "login");
  const [role, setRole] = useState<Role>(params.get("role") === "teacher" ? "teacher" : "student");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [classCode, setClassCode] = useState("");
  const [grade, setGrade] = useState(7);
  const [className, setClassName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  function goByRole(r: Role) {
    // Maskot salomlashsin — keyin o'tamiz (bir martalik hodisa, 700ms)
    setSuccess(true);
    setTimeout(() => router.push(r === "teacher" ? "/ustoz" : "/panel"), 700);
  }

  async function onLogin() {
    setError("");
    if (!nickname.trim() || !pin.trim()) {
      setError("Nik va PIN kiriting");
      return;
    }
    setBusy(true);
    try {
      const data = await postJson("/api/auth/login", { nickname: nickname.trim(), pin: pin.trim() });
      if (!data.ok) {
        setError(data.error ?? "Kirishda xatolik");
        return;
      }
      const me = await fetch("/api/me").then((r) => r.json()).catch(() => null);
      goByRole(me?.user?.role === "teacher" ? "teacher" : "student");
    } catch {
      setError("Server bilan aloqa uzildi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  async function onRegister() {
    setError("");
    if (nickname.trim().length < 2) {
      setError("Nik kamida 2 ta belgi bo'lsin");
      return;
    }
    if (pin.trim().length < 4) {
      setError("PIN kamida 4 ta raqam bo'lsin");
      return;
    }
    if (role === "student" && !classCode.trim()) {
      setError("Sinf kodini kiriting (o'qituvchidan oling)");
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        nickname: nickname.trim(),
        pin: pin.trim(),
        role,
      };
      if (role === "student") {
        body.classCode = classCode.trim().toUpperCase();
        body.grade = grade;
      } else {
        body.className = className.trim() || undefined;
      }
      if (invite) body.inviteCode = invite;
      const data = await postJson("/api/auth/register", body);
      if (!data.ok) {
        setError(data.error ?? "Ro'yxatdan o'tishda xatolik");
        return;
      }
      goByRole(role);
    } catch {
      setError("Server bilan aloqa uzildi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => {
        setTab(t);
        setError("");
      }}
      className={`flex-1 min-h-12 rounded-2xl font-bold text-base transition-colors ${
        tab === t ? "bg-[#4F46E5] text-white shadow-md" : "text-[#64748B] hover:text-[#0F172A]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-dvh bg-[#F8FAFC] text-[#0F172A] px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="fx-rise text-center mb-6">
          <Mascot mood={success ? "happy" : busy ? "thinking" : "hello"} size={92} />
          <h1 className="text-3xl font-extrabold text-[#4F46E5]">Bilimo</h1>
          <p className="text-[#64748B] mt-1">
            {success ? "Xush kelibsan! 🎉" : "O'qi, yech, tanga yig' — sinfda birinchi bo'l!"}
          </p>
        </div>

        {invite && (
          <div className="fx-rise mb-4 rounded-2xl bg-[#FACC15]/20 border-2 border-[#FACC15] px-4 py-3 text-sm font-semibold" style={{ "--fx-delay": "60ms" } as CSSProperties}>
            🎉 Do'sting seni taklif qildi! Ro'yxatdan o'tsang — senga <b>+20</b>, unga <b>+30</b> tanga.
          </div>
        )}

        <Card className="fx-rise p-5" style={{ "--fx-delay": "120ms" } as CSSProperties}>
          <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-5">
            {tabBtn("login", "Kirish")}
            {tabBtn("register", "Ro'yxatdan o'tish")}
          </div>

          {tab === "register" && (
            <div className="flex gap-2 mb-4">
              {(
                [
                  ["student", "🧒 O'quvchi"],
                  ["teacher", "👩‍🏫 O'qituvchi"],
                ] as [Role, string][]
              ).map(([r, label]) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`fx-opt flex-1 min-h-12 rounded-2xl font-bold text-sm border-2 ${
                    role === r
                      ? "border-[#4F46E5] bg-indigo-50 text-[#4F46E5] -translate-y-1 shadow-[0_6px_16px_rgba(79,70,229,0.25)]"
                      : "border-slate-200 text-[#64748B] hover:border-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Input
              label="Nik (taxallus)"
              placeholder="masalan: Aziz2011"
              value={nickname}
              maxLength={24}
              onChange={(e) => setNickname(e.target.value)}
            />
            <Input
              label="PIN (4–8 raqam)"
              placeholder="••••"
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />

            {tab === "register" && role === "student" && (
              <>
                <Input
                  label="Sinf kodi (o'qituvchi beradi)"
                  placeholder="masalan: AB3KZ9"
                  value={classCode}
                  maxLength={8}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  className="uppercase tracking-widest"
                />
                <label className="block">
                  <span className="block text-sm font-semibold text-[#334155] mb-1.5">Nechanchi sinfda o'qiysan?</span>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full min-h-12 px-4 rounded-2xl border-2 border-slate-200 bg-white text-base outline-none focus:border-[#4F46E5]"
                  >
                    {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>
                        {g}-sinf
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            {tab === "register" && role === "teacher" && (
              <Input
                label="Sinf nomi"
                placeholder="masalan: 7-A matematika"
                value={className}
                maxLength={60}
                onChange={(e) => setClassName(e.target.value)}
              />
            )}

            {error && (
              <div key={error} className="fx-shake rounded-2xl bg-red-50 border-2 border-[#DC2626]/30 text-[#DC2626] px-4 py-3 text-sm font-semibold">
                ⚠️ {error}
              </div>
            )}

            <Button
              big
              disabled={busy}
              onClick={tab === "login" ? onLogin : onRegister}
              className="mt-1 flex items-center justify-center gap-2"
            >
              {success ? "Tayyor! 🎉" : busy ? <Spinner size={22} /> : tab === "login" ? "Kirish 🚀" : "Boshlash 🎉"}
            </Button>
          </div>
        </Card>

        <p className="text-center text-xs text-[#94A3B8] mt-4">
          {tab === "login" ? "Hisobing yo'qmi? Yuqoridan «Ro'yxatdan o'tish»ni tanla." : "Hisobing bormi? «Kirish»ni tanla."}
        </p>
      </div>
    </main>
  );
}

export default function KirishPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh bg-[#F8FAFC] flex items-center justify-center">
          <Spinner size={36} />
        </main>
      }
    >
      <KirishInner />
    </Suspense>
  );
}
