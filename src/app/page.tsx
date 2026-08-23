"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function CoinLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="32" cy="32" r="30" fill="#FACC15" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#CA8A04" strokeWidth="3" />
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        fill="#713F12"
        fontFamily="Arial, sans-serif"
      >
        SA
      </text>
    </svg>
  );
}

export default function Home() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setInstallEvent(null);
    } else {
      // iOS Safari yoki prompt hali kelmagan brauzer
      setShowIosHint(true);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <CoinLogo size={34} />
            <span className="text-lg font-extrabold tracking-tight">
              Sinf <span className="text-primary">AI</span>
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/yordam"
              className="text-sm font-semibold text-muted transition-colors hover:text-primary"
            >
              Yordam
            </Link>
            <Link
              href="/kirish"
              className="rounded-btn bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              Kirish
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-primary-soft blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-30%] left-[-10%] h-72 w-72 rounded-full bg-coin/20 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-5xl gap-10 px-4 pb-14 pt-12 md:grid-cols-2 md:items-center md:pt-16">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                🇺🇿 O&apos;zbek tilida AI repetitor
              </span>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                Har bir o&apos;quvchiga{" "}
                <span className="text-primary">shaxsiy AI ustoz</span> 🎓
              </h1>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
                Savolingni yoz — Sinf AI qadam-baqadam tushuntiradi, mini-test
                beradi, to&apos;g&apos;ri javob uchun{" "}
                <span className="font-bold text-coin-dark">tanga 🪙</span>{" "}
                sovg&apos;a qiladi. Sinfdoshing bilan duel o&apos;ynab bilimingni
                isbotla!
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/kirish"
                  className="flex h-14 items-center justify-center rounded-btn bg-primary px-8 text-base font-extrabold text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
                >
                  🚀 Boshlash
                </Link>
                <button
                  type="button"
                  onClick={handleInstall}
                  className="flex h-14 items-center justify-center rounded-btn border-2 border-primary bg-white px-8 text-base font-extrabold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary-soft"
                >
                  {installed ? "✅ O'rnatildi" : "📲 O'rnatish"}
                </button>
                <Link
                  href="/kirish?role=teacher"
                  className="flex h-14 items-center justify-center rounded-btn bg-foreground px-8 text-base font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-700"
                >
                  👩‍🏫 O&apos;qituvchiman
                </Link>
              </div>

              {showIosHint && !installEvent && !installed && (
                <p className="mt-3 rounded-card bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
                  📱 iPhone&apos;da: <b>Ulashish</b> tugmasi →{" "}
                  <b>&laquo;Bosh ekranga qo&apos;shish&raquo;</b> ni tanlang.
                  Android Chrome&apos;da menyudan <b>&laquo;Ilovani
                  o&apos;rnatish&raquo;</b>.
                </p>
              )}
            </div>

            {/* Telefon mockup — jonli suhbat namunasi */}
            <div className="animate-rise mx-auto w-full max-w-sm [animation-delay:150ms]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CoinLogo size={28} />
                    <span className="text-sm font-bold">Sinf AI</span>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-coin/20 px-2.5 py-1 text-xs font-extrabold text-coin-dark">
                    🪙 145
                  </span>
                </div>
                <div className="space-y-3 pt-4 text-sm">
                  <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 font-medium text-white">
                    Kasrlarni qanday qo&apos;shaman? 3/4 + 1/6 = ?
                  </div>
                  <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5">
                    <p className="font-bold text-primary">Qadam 1️⃣</p>
                    <p className="mt-1">
                      Maxrajlarni tenglashtiramiz: 4 va 6 ning eng kichik umumiy
                      karralisi — <b>12</b> ...
                    </p>
                  </div>
                  <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-primary-soft px-4 py-2.5">
                    <p className="font-bold">✍️ Mini-test:</p>
                    <p className="mt-1">3/4 + 1/6 nechaga teng?</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-center text-xs font-bold">
                      <span className="rounded-lg bg-white px-2 py-1.5">4/10</span>
                      <span className="rounded-lg bg-green-500 px-2 py-1.5 text-white">
                        11/12 ✓
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-coin-dark">
                    <span className="animate-coin inline-block text-lg">🪙</span>
                    +5 tanga yutding!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 3 AFZALLIK ===== */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-center text-2xl font-extrabold md:text-3xl">
            Nega o&apos;quvchilar Sinf AI ni yaxshi ko&apos;radi?
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                emoji: "🧠",
                title: "Qadam-baqadam tushuntiradi",
                text: "Tayyor javob bermaydi — xuddi ustozdek, o'zbek tilida bosqichma-bosqich o'rgatadi. Tushunmasang, boshqacha usulda qayta tushuntiradi.",
              },
              {
                emoji: "🪙",
                title: "Bilim = tanga",
                text: "Har to'g'ri javob +5 tanga, kunlik kirish +10. Tangalar reytingda ko'rinadi — o'qish o'yinga aylanadi!",
              },
              {
                emoji: "⚔️",
                title: "1x1 duel",
                text: "Sinfdoshingni duelga chorla: bir xil savollar, kim tez va to'g'ri yechsa — +25 tanga va g'alaba!",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-card border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-2xl">
                  {f.emoji}
                </div>
                <h3 className="mt-4 text-lg font-extrabold">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== QANDAY ISHLAYDI ===== */}
        <section className="bg-white py-12">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-extrabold md:text-3xl">
              Qanday ishlaydi? 3 qadam
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  n: "1",
                  emoji: "✍️",
                  title: "Savolingni yoz",
                  text: "Masala, qoida yoki tushunmagan mavzuingni oddiy so'z bilan yozasan — rasm shart emas.",
                },
                {
                  n: "2",
                  emoji: "🤖",
                  title: "AI tushuntiradi",
                  text: "Sinf AI o'zbek tilida qadam-baqadam yechib beradi va mantiqni ko'rsatadi.",
                },
                {
                  n: "3",
                  emoji: "🏆",
                  title: "Test yech, tanga yut",
                  text: "Mavzu bo'yicha mini-test: to'g'ri javob — tanga, tangalar — sinf reytingi va duel!",
                },
              ].map((s) => (
                <div key={s.n} className="relative rounded-card bg-background p-6">
                  <span className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-coin text-base font-extrabold text-yellow-900 shadow">
                    {s.n}
                  </span>
                  <div className="pt-3 text-3xl">{s.emoji}</div>
                  <h3 className="mt-2 text-lg font-extrabold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== O'QITUVCHI UCHUN ===== */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="overflow-hidden rounded-card bg-primary px-6 py-10 text-white md:px-12">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                  👩‍🏫 O&apos;qituvchilar uchun
                </span>
                <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">
                  Sinfingizni 2 daqiqada ulang
                </h2>
                <ul className="mt-4 space-y-3 text-white/90">
                  <li className="flex gap-2.5">
                    <span>🔑</span>
                    <span>
                      <b>Sinf kodi</b> yarating — o&apos;quvchilar shu kod bilan
                      qo&apos;shiladi, hech qanday hujjat kerak emas.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span>📚</span>
                    <span>
                      <b>Kunlik mavzu</b> qo&apos;ying — AI aynan shu mavzu
                      bo&apos;yicha tushuntiradi va test tuzadi.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span>📊</span>
                    <span>
                      <b>Progress paneli</b> — kim nechta savol yechdi, kimga
                      yordam kerak: hammasi bitta jadvalda.
                    </span>
                  </li>
                </ul>
                <Link
                  href="/kirish?role=teacher"
                  className="mt-6 inline-flex h-13 items-center justify-center rounded-btn bg-coin px-8 py-3.5 text-base font-extrabold text-yellow-900 shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-105"
                >
                  O&apos;qituvchi sifatida boshlash →
                </Link>
              </div>
              <div className="rounded-card bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-bold text-white/70">5-A sinf · Matematika</p>
                <div className="mt-3 space-y-2 text-sm">
                  {[
                    { name: "Aziza", coins: 230, ok: "18/20" },
                    { name: "Jasur", coins: 195, ok: "15/19" },
                    { name: "Malika", coins: 160, ok: "12/16" },
                  ].map((r, i) => (
                    <div
                      key={r.name}
                      className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5"
                    >
                      <span className="font-bold">
                        {["🥇", "🥈", "🥉"][i]} {r.name}
                      </span>
                      <span className="text-white/80">
                        ✅ {r.ok} · 🪙 {r.coins}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/60">
                  * Namuna ko&apos;rinish — panel jonli yangilanadi
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== YAKUNIY CTA ===== */}
        <section className="mx-auto max-w-3xl px-4 pb-16 pt-4 text-center">
          <div className="animate-coin mx-auto w-fit text-5xl">🪙</div>
          <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">
            Bugun birinchi tangangni yut!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Ro&apos;yxatdan o&apos;tish 30 soniya: taxallus + PIN. Telefon raqami
            ham shart emas.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/kirish"
              className="flex h-14 items-center justify-center rounded-btn bg-primary px-10 text-base font-extrabold text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
            >
              🚀 Boshlash — bepul
            </Link>
            <button
              type="button"
              onClick={handleInstall}
              className="flex h-14 items-center justify-center rounded-btn border-2 border-primary bg-white px-10 text-base font-extrabold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary-soft"
            >
              {installed ? "✅ O'rnatildi" : "📲 Telefonga o'rnatish"}
            </button>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-center text-sm text-muted sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <CoinLogo size={24} />
            <span className="font-bold text-foreground">Sinf AI</span>
            <span>· AI bilan o&apos;qish o&apos;yinga aylanadi</span>
          </div>
          <nav className="flex gap-4 font-semibold">
            <Link href="/kirish" className="hover:text-primary">
              Kirish
            </Link>
            <Link href="/yordam" className="hover:text-primary">
              Yordam
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
