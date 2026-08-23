"use client";

import { useEffect, useState } from "react";

/** "Google bilan kirish" tugmasi. Server kalitlari (GOOGLE_CLIENT_ID/SECRET)
 *  yo'q bo'lsa — tugma umuman ko'rinmaydi va sayt avvalgidek ishlaydi. */
export default function GoogleButton() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/auth/google?check=1")
      .then((r) => r.json())
      .then((d) => setEnabled(!!d?.enabled))
      .catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;

  return (
    <>
      <a
        href="/api/auth/google"
        className="flex items-center justify-center gap-3 w-full min-h-12 rounded-2xl border-2 border-slate-200 bg-white font-bold text-[#0F172A] hover:border-slate-300 hover:bg-slate-50 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C41 35.4 44 30.2 44 24c0-1.3-.1-2.6-.4-3.9z"/>
        </svg>
        Google bilan kirish
      </a>
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-semibold text-[#94A3B8]">yoki</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
    </>
  );
}
