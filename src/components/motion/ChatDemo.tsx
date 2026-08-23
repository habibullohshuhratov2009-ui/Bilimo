import Mascot from "@/components/ui/Mascot";

/**
 * Telefon maketi ichidagi "jonli" suhbat — xabarlar ketma-ket pop bo'lib chiqadi,
 * oxirida AI yozayapti-indikatori aylanib turadi, tanga aylanib tushadi.
 * Sof CSS animatsiya (animate-pop + d-kechikishlar), reduced-motion hurmat qilinadi.
 */
export default function ChatDemo() {
  return (
    <div className="rounded-[32px] border-[6px] border-slate-900 bg-white shadow-phone">
      {/* telefon tepa "notch" */}
      <div className="flex justify-center pt-2">
        <span className="h-1.5 w-20 rounded-full bg-slate-200" />
      </div>

      <div className="p-4">
        {/* app header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Mascot mood="happy" size={34} animated={false} />
            <span className="text-sm font-extrabold">Sinf AI</span>
          </div>
          <span className="flex items-center gap-1 rounded-full grad-coin px-2.5 py-1 text-xs font-extrabold text-coin-deep shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="animate-coin-spin">
              <circle cx="12" cy="12" r="11" fill="#fff7cc" stroke="#CA8A04" strokeWidth="2" />
            </svg>
            145
          </span>
        </div>

        <div className="space-y-3 pt-4 text-sm">
          {/* o'quvchi savoli */}
          <div className="animate-pop d2 ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md grad-primary px-4 py-2.5 font-medium text-white shadow-toy">
            Kasrlarni qanday qo&apos;shaman? 3/4 + 1/6 = ?
          </div>

          {/* AI javobi */}
          <div className="animate-pop d4 w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5">
            <p className="font-extrabold text-primary">Qadam 1</p>
            <p className="mt-1">
              Maxrajlarni tenglashtiramiz: 4 va 6 uchun eng kichik umumiy karrali —{" "}
              <b>12</b>
            </p>
          </div>

          {/* mini-test */}
          <div className="animate-pop d6 w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-primary-soft px-4 py-2.5">
            <p className="font-extrabold">Mini-test</p>
            <p className="mt-1">3/4 + 1/6 nechaga teng?</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-center text-xs font-extrabold">
              <span className="rounded-lg bg-white px-2 py-1.5">4/10</span>
              <span className="animate-pulse-soft rounded-lg bg-mint px-2 py-1.5 text-white">
                11/12 ✓
              </span>
            </div>
          </div>

          {/* tanga mukofoti */}
          <div className="animate-pop d8 flex items-center gap-2 text-xs font-extrabold text-coin-dark">
            <span className="animate-coin-drop inline-block">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="11" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
                <path
                  d="M12 7.2l1.35 2.74 3.02.44-2.18 2.13.51 3.01L12 14.1l-2.7 1.42.51-3.01-2.18-2.13 3.02-.44L12 7.2z"
                  fill="#CA8A04"
                />
              </svg>
            </span>
            +5 tanga yutding!
          </div>

          {/* AI yozayapti... (doim jonli) */}
          <div className="animate-pop d9 flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3">
            <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
            <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
            <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
