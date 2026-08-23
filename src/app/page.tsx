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

function PlayIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="-ml-1 shrink-0">
      <path d="M8 5.14v13.72c0 .93 1.02 1.5 1.8.99l10.3-6.86a1.19 1.19 0 0 0 0-1.98L9.8 4.15C9.02 3.64 8 4.2 8 5.14z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="-ml-1 shrink-0"
    >
      <path d="M12 4v10m0 0l-4.2-4.2M12 14l4.2-4.2" />
      <path d="M4.5 16.5v1.8A2.7 2.7 0 0 0 7.2 21h9.6a2.7 2.7 0 0 0 2.7-2.7v-1.8" />
    </svg>
  );
}

function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="-ml-1 shrink-0"
    >
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="-mr-1 shrink-0"
    >
      <path d="M4.5 12h15m0 0l-5.6-5.6M19.5 12l-5.6 5.6" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.1 5.6 5.6 2.1-5.6 2.1L12 17.9l-2.1-5.6-5.6-2.1 5.6-2.1L12 2.5z" />
      <circle cx="19" cy="19" r="2.2" opacity="0.55" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.2 2.2L4.8 13.4h5.1L10.8 22l8.4-11.6h-5.1l-0.9-8.2z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="4" y="12.5" width="4.2" height="7.5" rx="1.2" />
      <rect x="9.9" y="7" width="4.2" height="13" rx="1.2" />
      <rect x="15.8" y="10" width="4.2" height="10" rx="1.2" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <SparkIcon />,
    title: "AI yechim",
    text: "Qadam-baqadam tushuntirish",
  },
  {
    icon: <BoltIcon />,
    title: "1x1 duel",
    text: "Sinfdosh bilan bellashuv",
  },
  {
    icon: <CoinIcon size={20} />,
    title: "Tanga + reyting",
    text: "Har to'g'ri javob +5",
  },
  {
    icon: <ChartIcon />,
    title: "O'qituvchi paneli",
    text: "Sinf progressi jonli",
  },
];

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

  const installLabel = installed ? (
    <>
      <CheckIcon /> O&apos;rnatildi
    </>
  ) : (
    <>
      <DownloadIcon /> O&apos;rnatish
    </>
  );

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-20 border-b border-indigo-100/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Mascot mood="happy" size={32} animated={false} />
            <span className="text-lg font-extrabold tracking-tight">
              Bilim<span className="text-primary">o</span>
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/yordam"
              className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl px-3 text-sm font-semibold text-muted transition-colors hover:bg-primary-soft hover:text-primary"
            >
              Yordam
            </Link>
            <Link href="/kirish" className="btn-3d btn-3d--primary h-11 px-5 text-sm">
              Kirish
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="grad-hero relative overflow-hidden">
          <FloatingCoins className="opacity-40" />
          <div className="relative mx-auto grid max-w-5xl gap-12 px-4 pb-16 pt-10 md:grid-cols-2 md:items-center md:pt-16">
            <div>
              <span className="animate-pop d1 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-bold text-primary shadow-sm">
                O&apos;zbek tilidagi AI repetitor
              </span>
              <h1 className="animate-rise d2 mt-5 text-[2.6rem] font-extrabold leading-[1.06] tracking-tight md:text-6xl">
                O&apos;qish endi{" "}
                <span className="bg-gradient-to-r from-violet-500 to-primary bg-clip-text text-transparent">
                  o&apos;yin!
                </span>
              </h1>
              <p className="animate-rise d3 mt-4 max-w-md text-lg leading-relaxed text-muted">
                Bilimo savolingni qadam-baqadam tushuntiradi, to&apos;g&apos;ri
                javob uchun <b className="text-coin-dark">tanga</b> beradi.
                Sinfdoshing bilan 1x1 duel!
              </p>

              <div className="animate-rise d4 mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/kirish" className="btn-3d btn-3d--primary h-14 px-8 text-base">
                  <PlayIcon /> Boshlash
                </Link>
                <button
                  type="button"
                  onClick={handleInstall}
                  className="btn-3d btn-3d--soft h-14 px-8 text-base"
                >
                  {installLabel}
                </button>
              </div>

              {showIosHint && !installEvent && !installed && (
                <p className="animate-pop mt-3 rounded-card bg-white px-4 py-3 text-sm font-medium text-primary shadow-sm">
                  iPhone&apos;da: <b>Ulashish</b> →{" "}
                  <b>&laquo;Bosh ekranga qo&apos;shish&raquo;</b>.
                  Android Chrome&apos;da menyudan{" "}
                  <b>&laquo;Ilovani o&apos;rnatish&raquo;</b>.
                </p>
              )}

              {/* Imkoniyatlar darrov ko'rinsin */}
              <div className="animate-rise d5 mt-8 grid grid-cols-2 gap-3 md:mt-10">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="rounded-xl border border-indigo-100/80 bg-white p-3.5 shadow-sm"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      {f.icon}
                    </span>
                    <p className="mt-2.5 text-sm font-extrabold">{f.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Telefon maketi — jonli mahsulot demo */}
            <div className="animate-rise d5 relative mx-auto mt-2 w-full max-w-[330px] md:mt-0 md:max-w-sm">
              <div className="absolute -top-11 right-6 z-0 hidden md:block">
                <Mascot mood="happy" size={82} />
              </div>
              <div className="relative z-10">
                <ChatDemo />
              </div>
            </div>
          </div>
        </section>

        {/* ===== 3 QADAM ===== */}
        <section className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <div className="text-center">
            <h2 className="text-[1.7rem] font-extrabold tracking-tight md:text-4xl">
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
              },
              {
                n: "2",
                title: "AI tushuntiradi",
                text: "Zumi o'zbek tilida qadam-baqadam yechib, mantiqni ko'rsatadi.",
              },
              {
                n: "3",
                title: "Test yech, tanga yut",
                text: "Mini-testda to'g'ri javob +5 tanga. Tangalar reytingga qo'shiladi!",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="card-lift rounded-card border border-indigo-100/70 bg-white p-6 shadow-toy"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-extrabold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-extrabold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== TANGA + DUEL ===== */}
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-[1.7rem] font-extrabold tracking-tight md:text-4xl">
              Bilim = tanga. Tanga = g&apos;alaba.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {/* Tanga iqtisodiyoti */}
              <div className="card-lift rounded-card border border-indigo-100/70 bg-white p-7 shadow-toy">
                <div className="flex items-center gap-3">
                  <CoinIcon size={36} />
                  <h3 className="text-xl font-extrabold">Tangalar qanday yig&apos;iladi?</h3>
                </div>
                <ul className="mt-5 space-y-2.5 font-semibold">
                  {[
                    { t: "To'g'ri javob", c: "+5" },
                    { t: "Kunlik kirish", c: "+10" },
                    { t: "Duel g'alabasi", c: "+25" },
                  ].map((r) => (
                    <li
                      key={r.t}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <span>{r.t}</span>
                      <span className="flex items-center gap-1.5 font-extrabold tabular-nums text-coin-dark">
                        {r.c} <CoinIcon size={16} />
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
                <div className="mt-7 flex items-center justify-center gap-5">
                  <div className="flex w-28 flex-col items-center rounded-card bg-white/10 px-4 py-5">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-extrabold">
                      A
                    </span>
                    <span className="mt-2 text-sm font-extrabold">Aziza</span>
                    <span className="mt-0.5 text-xs tabular-nums text-white/75">5/5</span>
                  </div>
                  <span className="text-2xl font-extrabold text-coin">VS</span>
                  <div className="flex w-28 flex-col items-center rounded-card bg-white/10 px-4 py-5">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-extrabold">
                      J
                    </span>
                    <span className="mt-2 text-sm font-extrabold">Jasur</span>
                    <span className="mt-0.5 text-xs tabular-nums text-white/75">4/5</span>
                  </div>
                </div>
                <p className="mt-6 flex items-center justify-center gap-1.5 text-sm font-extrabold text-coin">
                  G&apos;olibga +25 <CoinIcon size={16} />
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== O'QITUVCHI UCHUN ===== */}
        <section className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <div className="overflow-hidden rounded-card grad-panel px-6 py-10 text-white shadow-toy md:px-12">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                  O&apos;qituvchilar uchun
                </span>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl">
                  Sinfingizni 2 daqiqada ulang
                </h2>
                <ul className="mt-5 space-y-3 text-white/90">
                  {[
                    <span key="1">
                      <b>Sinf kodi</b> yarating: o&apos;quvchilar shu kod bilan
                      qo&apos;shiladi, hujjat kerak emas.
                    </span>,
                    <span key="2">
                      <b>Kunlik mavzu</b> qo&apos;ying: AI aynan shu mavzu
                      bo&apos;yicha tushuntiradi va test tuzadi.
                    </span>,
                    <span key="3">
                      <b>Progress paneli</b>: kim nechta savol yechdi, kimga
                      yordam kerak, hammasi bitta jadvalda.
                    </span>,
                  ].map((content, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <CheckIcon size={12} />
                      </span>
                      {content}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/kirish?role=teacher"
                  className="btn-3d btn-3d--coin mt-7 h-12 px-7 text-base"
                >
                  O&apos;qituvchi sifatida boshlash <ArrowRightIcon />
                </Link>
              </div>
              <div className="rounded-card bg-white/10 p-5">
                <p className="text-sm font-bold text-white/70">5-A sinf · Matematika</p>
                <div className="mt-3 space-y-2 text-sm">
                  {[
                    { name: "Aziza", coins: 230, ok: "18/20" },
                    { name: "Jasur", coins: 195, ok: "15/19" },
                    { name: "Malika", coins: 160, ok: "12/16" },
                  ].map((r, i) => (
                    <div
                      key={r.name}
                      className={`animate-pop flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5 ${["d3", "d5", "d7"][i]}`}
                    >
                      <span className="flex items-center gap-2.5 font-bold">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs tabular-nums">
                          {i + 1}
                        </span>
                        {r.name}
                      </span>
                      <span className="flex items-center gap-1.5 tabular-nums text-white/85">
                        {r.ok} · {r.coins} <CoinIcon size={14} />
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

        {/* ===== YUKLAB OLISH ===== */}
        <section id="yuklab-olish" className="mx-auto max-w-3xl px-4 pb-4">
          <div className="rounded-card border border-indigo-100 bg-white p-6 text-center shadow-sm">
            <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">
              Ilovani qurilmangizga o&apos;rnating
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Brauzersiz ham ishlaydi: telefonga <b>APK</b>, kompyuterga{" "}
              <b>Windows o&apos;rnatgich</b>.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/Bilimo.apk"
                download
                className="btn-3d btn-3d--primary h-12 px-6 text-sm"
              >
                <DownloadIcon /> Android (APK)
              </a>
              <a
                href="https://github.com/habibullohshuhratov2009-ui/Bilimo/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-3d btn-3d--soft h-12 px-6 text-sm"
              >
                <DownloadIcon /> Windows (.exe)
              </a>
              <button
                type="button"
                onClick={handleInstall}
                className="btn-3d btn-3d--soft h-12 px-6 text-sm"
              >
                {installLabel}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">
              APK&apos;ni o&apos;rnatishda Android &laquo;noma&apos;lum manba&raquo; ruxsatini so&apos;raydi — bu normal holat.
            </p>
          </div>
        </section>

        {/* ===== YAKUNIY CTA ===== */}
        <section className="mx-auto max-w-3xl px-4 pb-24 pt-6 text-center">
          <h2 className="text-[1.7rem] font-extrabold tracking-tight md:text-4xl">
            Bugun birinchi tangangni yut!
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Savol ber, tushunib ol, tanga yig&apos;, chempion bo&apos;l. Hammasi
            bepul boshlanadi.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/kirish" className="btn-3d btn-3d--primary h-14 px-10 text-base">
              <PlayIcon /> Boshlash
            </Link>
            <button
              type="button"
              onClick={handleInstall}
              className="btn-3d btn-3d--soft h-14 px-10 text-base"
            >
              {installLabel}
            </button>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-indigo-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-center text-sm text-muted sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <Mascot mood="happy" size={24} animated={false} />
            <span className="font-bold text-foreground">Bilimo</span>
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
