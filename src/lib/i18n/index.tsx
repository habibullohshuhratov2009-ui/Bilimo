"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_LANG, DICT, LANGS, type Key, type Lang } from "./dict";

const COOKIE = "blimo_lang";

function readLang(): Lang {
  if (typeof document === "undefined") return DEFAULT_LANG;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
  const v = m?.[1];
  return (LANGS as readonly string[]).includes(v ?? "") ? (v as Lang) : DEFAULT_LANG;
}

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** t("student.greeting", { name: "Ali" }) */
  t: (key: Key, vars?: Record<string, string | number>) => string;
};

const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // Cookie faqat brauzerda o'qiladi — server bilan mos kelmasligi (hydration) oldi olinadi.
  useEffect(() => setLangState(readLang()), []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `${COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, []);

  const t = useCallback<Ctx["t"]>(
    (key, vars) => {
      let s: string = DICT[lang][key] ?? DICT[DEFAULT_LANG][key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      return s;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useI18n(): Ctx {
  const c = useContext(LangCtx);
  if (!c) throw new Error("useI18n faqat <LangProvider> ichida ishlaydi");
  return c;
}

export { LANGS, LANG_LABEL, type Lang, type Key } from "./dict";
