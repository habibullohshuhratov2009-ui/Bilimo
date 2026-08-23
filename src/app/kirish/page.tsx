"use client";

import { Suspense, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import Mascot from "@/components/app/Mascot";
import GoogleButton from "@/components/auth/GoogleButton";
import "@/components/app/fx.css";

type Tab = "login" | "register";
type Role = "student" | "teacher";
type ForgotStep = "off" | "email" | "code";

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "Server javob bermadi" }));
  return data as { ok: boolean; error?: string; message?: string };
}

function KirishInner() {
  const router = useRouter();
  const params = useSearchParams();
  const invite = params.get("invite") ?? "";
  const needClass = params.get("sinf") === "1"; // Google bilan birinchi kirish: sinf kodi so'raladi
  const urlError = params.get("xato");

  const [tab, setTab] = useState<Tab>(invite ? "register" : "login");
  const [role, setRole] = useState<Role>(params.get("role") === "teacher" ? "teacher" : "student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loginId, setLoginId] = useState(""); // Ism Familiya yoki email
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [classCode, setClassCode] = useState("");
  const [grade, setGrade] = useState(7);
  const [className, setClassName] = useState("");
  const [error, setError] = useState(
    urlError ? "Google bilan kirishda xatolik. Qayta urinib ko'ring yoki PIN bilan kiring." : ""
  );
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [forgot, setForgot] = useState<ForgotStep>("off");
  const [forgotMsg, setForgotMsg] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPin, setNewPin] = useState("");

  function goByRole(r: Role) {
    setSuccess(true);
    setTimeout(() => router.push(r === "teacher" ? "/ustoz" : "/panel"), 700);
  }

  async function onLogin() {
    setError("");
    if (!loginId.trim() || !pin.trim()) {
      setError("Ism-familiya (yoki email) va PIN kiriting");
      return;
    }
    setBusy(true);
    try {
      const data = await postJson("/api/auth/login", { login: loginId.trim(), pin: pin.trim() });
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
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError("Ism va familiyani to'liq yozing");
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        pin: pin.trim(),
        role,
      };
      if (email.trim()) body.email = email.trim();
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

  async function onJoinClass() {
    setError("");
    if (!classCode.trim()) {
      setError("Sinf kodini kiriting (o'qituvchidan oling)");
      return;
    }
    setBusy(true);
    try {
      const data = await postJson("/api/auth/join-class", {
        classCode: classCode.trim().toUpperCase(),
        grade,
      });
      if (!data.ok) {
        setError(data.error ?? "Sinfga qo'shilishda xatolik");
        return;
      }
      goByRole("student");
    } catch {
      setError("Server bilan aloqa uzildi. Qayta urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  async function onForgotSend() {
    setError("");
    if (!email.trim().includes("@")) {
      setError("Ro'yxatda ko'rsatgan emailingizni yozing");
      return;
    }
    setBusy(true);
    try {
      const data = await postJson("/api/auth/forgot", { email: email.trim() });
      if (!data.ok) {
        setError(data.error ?? "Xatolik");
        return;
      }
      setForgotMsg(data.message ?? "Kod yaratildi");
      setForgot("code");
    } catch {
      setError("Server bilan aloqa uzildi.");
    } finally {
      setBusy(false);
    }
  }

  async function onForgotReset() {
    setError("");
    if (!/^\d{6}$/.test(resetCode.trim())) {
      setError("6 xonali kodni kiriting");
      return;
    }
    if (newPin.trim().length < 4) {
      setError("Yangi PIN kamida 4 ta raqam bo'lsin");
      return;
    }
    setBusy(true);
    try {
      const data = await postJson("/api/auth/reset", {
        email: email.trim(),
        code: resetCode.trim(),
        newPin: newPin.trim(),
      });
      if (!data.ok) {
        setError(data.error ?? "Kod xato");
        return;
      }
      const me = await fetch("/api/me").then((r) => r.json()).catch(() => null);
      goByRole(me?.user?.role === "teacher" ? "teacher" : "student");
    } catch {
      setError("Server bilan aloqa uzildi.");
    } finally {
      setBusy(false);
    }
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => {
        setTab(t);
        setForgot("off");
        setError("");
      }}
      className={`flex-1 min-h-12 rounded-2xl font-bold text-base transition-colors ${
        tab === t ? "bg-[#4F46E5] text-white shadow-md" : "text-[#64748B] hover:text-[#0F172A]"
      }`}
    >
      {label}
    </button>
  );

  const errorBox = error && (
    <div key={error} className="fx-shake rounded-2xl bg-red-50 border-2 border-[#DC2626]/30 text-[#DC2626] px-4 py-3 text-sm font-semibold">
      ⚠️ {error}
    </div>
  );

  // Sinf raqami o'qituvchi ochgan sinfdan olinadi — o'quvchi o'zi tanlamaydi.
  // Aks holda ustozda "11-V", o'quvchida "7-sinf" degan ziddiyat chiqardi.
  const gradeSelect = (
    <p className="rounded-2xl bg-[#F1F5F9] px-4 py-3 text-sm text-[#475569]">
      🎓 Sinfing <b>o'qituvchi kodi</b> bo'yicha avtomatik aniqlanadi.
    </p>
  );

  // ——— Google bilan birinchi kirish: faqat sinf kodi so'raladi ———
  if (needClass) {
    return (
      <main className="min-h-dvh bg-[#F8FAFC] text-[#0F172A] px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="fx-rise text-center mb-6">
            <Mascot mood={success ? "happy" : "hello"} size={92} />
            <h1 className="text-3xl font-extrabold text-[#4F46E5]">Blimo</h1>
            <p className="text-[#64748B] mt-1">Deyarli tayyor! Endi sinfingga qo'shil 🎒</p>
          </div>
          <Card className="fx-rise p-5" style={{ "--fx-delay": "120ms" } as CSSProperties}>
            <div className="flex flex-col gap-3">
              <Input
                label="Sinf kodi (o'qituvchi beradi)"
                placeholder="masalan: AB3KZ9"
                value={classCode}
                maxLength={8}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                className="uppercase tracking-widest"
              />
              {gradeSelect}
              {errorBox}
              <Button big disabled={busy} onClick={onJoinClass} className="mt-1 flex items-center justify-center gap-2">
                {success ? "Tayyor! 🎉" : busy ? <Spinner size={22} /> : "Sinfga qo'shilish 🎒"}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#F8FAFC] text-[#0F172A] px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="fx-rise text-center mb-6">
          <Mascot mood={success ? "happy" : busy ? "thinking" : "hello"} size={92} />
          <h1 className="text-3xl font-extrabold text-[#4F46E5]">Blimo</h1>
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
          {forgot === "off" && (
            <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 mb-5">
              {tabBtn("login", "Kirish")}
              {tabBtn("register", "Ro'yxatdan o'tish")}
            </div>
          )}

          {forgot === "off" && <GoogleButton />}

          {/* ——— PIN tiklash (email orqali) ——— */}
          {forgot !== "off" && (
            <div className="flex flex-col gap-3">
              <h2 className="font-extrabold text-lg">🔑 PIN'ni tiklash</h2>
              {forgot === "email" && (
                <>
                  <p className="text-sm text-[#64748B]">
                    Ro'yxatda email ko'rsatgan bo'lsang — kod shu emailga bog'lanadi.
                    Email yo'q bo'lsa, <b>o'qituvchingdan PIN tiklashni so'ra</b> (u bir tugma bilan tiklaydi).
                  </p>
                  <Input
                    label="Email"
                    placeholder="misol@gmail.com"
                    type="email"
                    value={email}
                    maxLength={120}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errorBox}
                  <Button big disabled={busy} onClick={onForgotSend} className="flex items-center justify-center gap-2">
                    {busy ? <Spinner size={22} /> : "Kod olish"}
                  </Button>
                </>
              )}
              {forgot === "code" && (
                <>
                  {forgotMsg && (
                    <div className="rounded-2xl bg-indigo-50 border-2 border-[#4F46E5]/20 px-4 py-3 text-sm font-semibold text-[#334155]">
                      ✉️ {forgotMsg}
                    </div>
                  )}
                  <Input
                    label="6 xonali kod"
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                  />
                  <Input
                    label="Yangi PIN (4–8 raqam)"
                    placeholder="••••"
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                  />
                  {errorBox}
                  <Button big disabled={busy} onClick={onForgotReset} className="flex items-center justify-center gap-2">
                    {success ? "Tayyor! 🎉" : busy ? <Spinner size={22} /> : "PIN'ni yangilash 🔑"}
                  </Button>
                </>
              )}
              <button
                onClick={() => {
                  setForgot("off");
                  setError("");
                }}
                className="text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
              >
                ← Kirishga qaytish
              </button>
            </div>
          )}

          {forgot === "off" && (
            <>
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
                {tab === "login" ? (
                  <Input
                    label="Ism Familiya (yoki email)"
                    placeholder="masalan: Aziz Karimov"
                    value={loginId}
                    maxLength={80}
                    onChange={(e) => setLoginId(e.target.value)}
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Ism"
                        placeholder="Aziz"
                        value={firstName}
                        maxLength={30}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                      <Input
                        label="Familiya"
                        placeholder="Karimov"
                        value={lastName}
                        maxLength={30}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <Input
                  label="PIN (4–8 raqam)"
                  placeholder="••••"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />

                {tab === "register" && (
                  <Input
                    label="Email (ixtiyoriy — PIN esdan chiqsa tiklash uchun)"
                    placeholder="misol@gmail.com"
                    type="email"
                    value={email}
                    maxLength={120}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                )}

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
                    {gradeSelect}
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

                {errorBox}

                <Button
                  big
                  disabled={busy}
                  onClick={tab === "login" ? onLogin : onRegister}
                  className="mt-1 flex items-center justify-center gap-2"
                >
                  {success ? "Tayyor! 🎉" : busy ? <Spinner size={22} /> : tab === "login" ? "Kirish 🚀" : "Boshlash 🎉"}
                </Button>

                {tab === "login" && (
                  <button
                    onClick={() => {
                      setForgot("email");
                      setError("");
                    }}
                    className="text-sm font-semibold text-[#4F46E5] hover:underline"
                  >
                    PIN esdan chiqdimi?
                  </button>
                )}
              </div>
            </>
          )}
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
