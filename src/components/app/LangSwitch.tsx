"use client";

import { LANGS, LANG_LABEL, useI18n } from "@/lib/i18n";

/** Til almashtirgich: UZ / RU. Tanlov cookie'da saqlanadi. */
export default function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  return (
    <div
      role="group"
      aria-label="Til / Язык"
      className={`inline-flex rounded-xl border border-slate-200 bg-white p-0.5 ${className}`}
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          title={LANG_LABEL[l]}
          className={`min-w-11 rounded-lg px-2.5 py-1.5 text-xs font-extrabold uppercase transition-colors ${
            lang === l ? "bg-[#4F46E5] text-white" : "text-[#64748B] hover:bg-slate-50"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
