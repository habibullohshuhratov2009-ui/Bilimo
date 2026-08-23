import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Yordam",
  description:
    "Blimo bo'yicha ko'p so'raladigan savollar: ro'yxatdan o'tish, sinf kodi, tangalar, duel va o'qituvchi paneli haqida javoblar.",
};

const FAQ = [
  {
    emoji: "📝",
    q: "Qanday ro'yxatdan o'taman?",
    a: "«Boshlash» tugmasini bos → taxallus (nickname) va 4 xonali PIN o'ylab top → o'qituvching bergan sinf kodini kirit. Bo'ldi! Telefon raqami, email yoki hujjat kerak emas — 30 soniyada tayyor bo'lasan.",
  },
  {
    emoji: "🔑",
    q: "Sinf kodi qayerdan olinadi?",
    a: "Sinf kodini o'qituvching beradi. O'qituvching «O'qituvchiman» tugmasi orqali ro'yxatdan o'tganda, tizim sinf uchun maxsus kod yaratadi. Shu kodni kiritsang — avtomatik o'z sinfingga qo'shilasan va sinf reytingida qatnashasan.",
  },
  {
    emoji: "🪙",
    q: "Tanga nima va uni qanday yig'aman?",
    a: "Tanga — bilim uchun mukofot. Har kuni kirsang +10, mini-testda har to'g'ri javob uchun +5, duelda qatnashsang +5, duelda g'alaba qozonsang +25, do'stingni taklif qilsang +30 tanga olasan. Tangalar sinf reytingida ko'rinadi — kim ko'p bilsa, o'sha yuqorida!",
  },
  {
    emoji: "⚔️",
    q: "Duel qanday o'ynaladi?",
    a: "Panelda «Duel» ni ochib kod yaratasan va uni sinfdoshingga aytasan. U kodni kiritib qo'shiladi — ikkalangga bir xil savollar chiqadi. Kim ko'proq to'g'ri va tezroq javob bersa — g'olib! G'olib +25 tanga, qatnashgan har kim +5 tanga oladi.",
  },
  {
    emoji: "👩‍🏫",
    q: "O'qituvchi nima qiladi?",
    a: "O'qituvchi sinf yaratadi va kodini o'quvchilarga tarqatadi, har kuni mavzu qo'yadi (AI aynan shu mavzu bo'yicha tushuntiradi va test tuzadi) hamda panelda sinf progressini kuzatadi: kim nechta savol yechdi, kimning nechta to'g'ri javobi bor, kimga qo'shimcha yordam kerak.",
  },
];

export default function YordamPage() {
  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold">
            <span className="text-xl">🪙</span>
            <span>
              Bili<span className="text-primary">mo</span>
            </span>
          </Link>
          <Link
            href="/kirish"
            className="rounded-btn bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            Kirish
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
          🛟 Yordam markazi
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          Ko&apos;p so&apos;raladigan savollar
        </h1>
        <p className="mt-2 text-muted">
          Blimo dan foydalanish bo&apos;yicha eng muhim javoblar — qisqa va
          aniq.
        </p>

        <div className="mt-8 space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-card border border-slate-200 bg-white p-5 shadow-sm open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-extrabold [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2.5">
                  <span className="text-xl">{item.emoji}</span>
                  {item.q}
                </span>
                <span className="text-primary transition-transform group-open:rotate-45">
                  ＋
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 rounded-card bg-primary px-6 py-8 text-center text-white">
          <h2 className="text-xl font-extrabold">Yordam kerakmi? 🤝</h2>
          <p className="mx-auto mt-2 max-w-md text-white/85">
            Javob topolmadingmi? Avval o&apos;qituvchingdan so&apos;ra — sinf
            kodi va mavzular unda. Texnik muammo bo&apos;lsa, sahifani yangilab
            qayta urinib ko&apos;r yoki qaytadan kir.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/kirish"
              className="rounded-btn bg-coin px-6 py-3 font-extrabold text-yellow-900 transition-all hover:-translate-y-0.5"
            >
              🚀 Boshlash
            </Link>
            <Link
              href="/"
              className="rounded-btn border-2 border-white/40 px-6 py-3 font-extrabold text-white transition-colors hover:bg-white/10"
            >
              ← Bosh sahifa
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-muted">
        Blimo · AI bilan o&apos;qish o&apos;yinga aylanadi 🪙
      </footer>
    </div>
  );
}
