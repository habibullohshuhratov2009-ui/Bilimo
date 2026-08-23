"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Mascot from "@/components/ui/Mascot";
import ChatDemo from "@/components/motion/ChatDemo";
import FloatingCoins from "@/components/motion/FloatingCoins";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function CoinIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="inline-block shrink-0">
      <circle cx="12" cy="12" r="11" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="#CA8A04" strokeWidth="1.2" opacity="0.6" />
      <path
        d="M12 7.2l1.35 2.74 3.02.44-2.18 2.13.51 3.01L12 14.1l-2.7 1.42.51-3.01-2.18-2.13 3.02-.44L12 7.2z"
        fill="#CA8A04"
        opacity="0.85"
      />
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
      setShowIosHint(true);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-20 border-b border-indigo-100/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Mascot mood="happy" size={38} animated={false} />
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
              className="btn-push rounded-btn grad-primary px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_#3730A3]"
            >
              Kirish
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="grad-hero relative overflow-hidden">
          <FloatingCoins />
          <div className="relative mx-auto grid max-w-5xl gap-12 px-4 pb-16 pt-10 md:grid-cols-2 md:items-center md:pt-14">
            <div>
              <span className="animate-pop d1 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-bold text-primary shadow-sm">
                🇺🇿 O&apos;zbek tilidagi AI repetitor
              </span>
              <h1 className="animate-rise d2 mt-4 text-[2.6rem] font-extrabold leading-[1.08] tracking-tight md:text-6xl">
                O&apos;qish endi{" "}
                <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent">
                  o&apos;yin!
                </span>
              </h1>
              <p className="animate-rise d3 mt-4 max-w-md text-lg leading-relaxed text-muted">
                Sinf AI savolingni qadam-baqadam tushuntiradi, to&apos;g&apos;ri
                javob uchun <b className="text-coin-dark">tanga</b> beradi.
                Sinfdoshing bilan 1x1 duel!
              </p>

              <div className="animate-rise d4 mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/kirish"
                  className="btn-push flex h-14 items-center justify-center rounded-btn grad-primary px-8 text-base font-extrabold text-white shadow-[0_5px_0_#3730A3,0_14px_30px_-8px_var(--primary-glow)]"
                >
                  🚀 Boshlash
                </Link>
                <button
                  type="button"
                  onClick={handleInstall}
                  className="btn-push flex h-14 items-center justify-center rounded-btn border-2 border-primary bg-white px-8 text-base font-extrabold text-primary shadow-[0_5px_0_#c7d2fe] hover:bg-primary-soft"
                >
                  {installed ? "✅ O'rnatildi" : "📲 O'rnatish"}
                </button>
              </div>

              {showIosHint && !installEvent && !installed && (
                <p className="animate-pop mt-3 rounded-card bg-white px-4 py-3 text-sm font-medium text-primary shadow-sm">
                  📱 iPhone&apos;da: <b>Ulashish</b> →{" "}
                  <b>&laquo;Bosh ekranga qo&apos;shish&raquo;</b>.
                  Android Chrome&apos;da menyudan{" "}
                  <b>&laquo;Ilovani o&apos;rnatish&raquo;</b>.
                </p>
              )}
            </div>

            {/* Telefon maketi + orqasidan mo'ralayotgan maskot */}
            <div className="animate-rise d5 relative mx-auto w-full max-w-sm">
              <div className="absolute -top-12 right-4 z-0">
                <Mascot mood="happy" size={96} />
              </div>
              <div className="relative z-10">
                <ChatDemo />
              </div>
            </div>
          </div>
        </section>

        {/* ===== 3 QADAM ===== */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold md:text-4xl">
              3 qadamda chempion bo&apos;l
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted">
              Ro&apos;yxatdan o&apos;tish 30 soniya: taxallus + PIN. Telefon
              raqami ham shart emas.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                n: "1",
                title: "Savolingni yoz",
                text: "Masala yoki tushunmagan mavzuni oddiy so'z bilan yozasan.",
                mood: "think" as const,
                bg: "bg-white",
              },
              {
                n: "2",
                title: "AI tushuntiradi",
                text: "Zumi o'zbek tilida qadam-baqadam yechib, mantiqni ko'rsatadi.",
                mood: "happy" as const,
                bg: "bg-primary-soft",
              },
              {
                n: "3",
                title: "Test yech, tanga yut",
                text: "Mini-testda to'g'ri javob +5 tanga. Tangalar reytingga qo'shiladi!",
                mood: "win" as const,
                bg: "bg-[#fefce8]",
              },
            ].map((s) => (
              <div
                key={s.n}
                className={`card-lift relative rounded-card border border-indigo-100/60 ${s.bg} p-6 pt-8 shadow-toy`}
              >
                <span className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full grad-coin text-base font-extrabold text-coin-deep shadow-md">
                  {s.n}
                </span>
                <Mascot mood={s.mood} size={72} />
                <h3 className="mt-3 text-lg font-extrabold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== TANGA + DUEL ===== */}
        <section className="relative overflow-hidden bg-white py-14">
          <FloatingCoins className="opacity-60" />
          <div className="relative mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-extrabold md:text-4xl">
              Bilim = tanga. Tanga = g&apos;alaba.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {/* Tanga iqtisodiyoti */}
              <div className="card-lift rounded-card border border-yellow-200/70 bg-gradient-to-b from-[#fefce8] to-white p-7 shadow-toy">
                <div className="flex items-center gap-3">
                  <span className="animate-coin inline-block">
                    <CoinIcon size={44} />
                  </span>
                  <h3 className="text-xl font-extrabold">Tangalar qanday yig&apos;iladi?</h3>
                </div>
                <ul className="mt-5 space-y-3 font-semibold">
                  {[
                    { t: "To'g'ri javob", c: "+5" },
                    { t: "Kunlik kirish", c: "+10" },
                    { t: "Duel g'alabasi", c: "+25" },
                  ].map((r) => (
                    <li
                      key={r.t}
                      className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
                    >
                      <span>{r.t}</span>
                      <span className="flex items-center gap-1.5 font-extrabold text-coin-dark">
                        {r.c} <CoinIcon size={18} />
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-muted">
                  Tangalar sinf reytingida ko&apos;rinadi. Kim ko&apos;p yig&apos;sa,
                  o&apos;sha chempion!
                </p>
              </div>

              {/* Duel */}
              <div className="card-lift relative overflow-hidden rounded-card grad-panel p-7 text-white shadow-toy">
                <h3 className="text-xl font-extrabold">1x1 duel</h3>
                <p className="mt-2 text-white/85">
                  Sinfdoshingni chorla: bir xil 5 savol, kim tez va to&apos;g&apos;ri
                  yechsa, g&apos;alaba uniki!
                </p>
                <div className="mt-6 flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center rounded-card bg-white/12 px-5 py-4 backdrop-blur">
                    <Mascot mood="win" size={76} />
                    <span className="mt-1 text-sm font-extrabold">Aziza</span>
                    <span className="text-xs text-white/75">5/5 ✓</span>
                  </div>
                  <span className="animate-pulse-soft text-3xl font-extrabold text-coin">
                    VS
                  </span>
                  <div className="flex flex-col items-center rounded-card bg-white/12 px-5 py-4 backdrop-blur">
                    <Mascot mood="think" size={76} />
                    <span className="mt-1 text-sm font-extrabold">Jasur</span>
                    <span className="text-xs text-white/75">4/5</span>
                  </div>
                </div>
                <p className="mt-5 flex items-center justify-center gap-1.5 text-sm font-extrabold text-coin">
                  G&apos;olibga +25 <CoinIcon size={16} />
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== O'QITUVCHI UCHUN ===== */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <div className="overflow-hidden rounded-card grad-panel px-6 py-10 text-white shadow-toy md:px-12">
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
                      <b>Sinf kodi</b> yarating: o&apos;quvchilar shu kod bilan
                      qo&apos;shiladi, hujjat kerak emas.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span>📚</span>
                    <span>
                      <b>Kunlik mavzu</b> qo&apos;ying: AI aynan shu mavzu
                      bo&apos;yicha tushuntiradi va test tuzadi.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span>📊</span>
                    <span>
                      <b>Progress paneli</b>: kim nechta savol yechdi, kimga
                      yordam kerak, hammasi bitta jadvalda.
                    </span>
                  </li>
                </ul>
                <Link
                  href="/kirish?role=teacher"
                  className="btn-push mt-6 inline-flex items-center justify-center rounded-btn grad-coin px-8 py-3.5 text-base font-extrabold text-coin-deep shadow-[0_4px_0_#A16207]"
                >
                  O&apos;qituvchi sifatida boshlash →
                </Link>
              </div>
              <div className="rounded-card bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-bold text-white/70">5-A sinf · Matematika</p>
                <div className="mt-3 space-y-2 text-sm">
                  {[
                    { name: "Aziza", coins: 230, ok: "18/20", medal: "🥇" },
                    { name: "Jasur", coins: 195, ok: "15/19", medal: "🥈" },
                    { name: "Malika", coins: 160, ok: "12/16", medal: "🥉" },
                  ].map((r, i) => (
                    <div
                      key={r.name}
                      className={`animate-pop flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5 ${["d3", "d5", "d7"][i]}`}
                    >
                      <span className="font-bold">
                        {r.medal} {r.name}
                      </span>
                      <span className="flex items-center gap-1 text-white/85">
                        ✅ {r.ok} · {r.coins} <CoinIcon size={14} />
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/60">
                  * Namuna ko&apos;rinish, panel jonli yangilanadi
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== YAKUNIY CTA ===== */}
        <section className="relative mx-auto max-w-3xl overflow-hidden px-4 pb-20 pt-6 text-center">
          <FloatingCoins className="opacity-70" />
          <div className="relative">
            <div className="mx-auto w-fit">
              <Mascot mood="win" size={130} />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold md:text-4xl">
              Bugun birinchi tangangni yut!
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted">
              Zumi seni kutyapti. Savol ber, tushunib ol, tanga yig&apos;,
              chempion bo&apos;l!
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/kirish"
                className="btn-push flex h-14 items-center justify-center rounded-btn grad-primary px-10 text-base font-extrabold text-white shadow-[0_5px_0_#3730A3,0_14px_30px_-8px_var(--primary-glow)]"
              >
                🚀 Boshlash
              </Link>
              <button
                type="button"
                onClick={handleInstall}
                className="btn-push flex h-14 items-center justify-center rounded-btn border-2 border-primary bg-white px-10 text-base font-extrabold text-primary shadow-[0_5px_0_#c7d2fe] hover:bg-primary-soft"
              >
                {installed ? "✅ O'rnatildi" : "📲 O'rnatish"}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-indigo-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-center text-sm text-muted sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <Mascot mood="happy" size={28} animated={false} />
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
