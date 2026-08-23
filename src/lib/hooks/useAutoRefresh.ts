import { useEffect } from "react";

/**
 * Ma'lumotni fonda yangilab turadi.
 * Nega kerak: o'quvchi sinfga qo'shilganda o'qituvchi panelida u DARROV ko'rinsin —
 * ilgari o'qituvchi sahifani qo'lda yangilamaguncha yangi o'quvchi chiqmasdi.
 *
 * Tejamkor: sahifa ko'rinmayotgan bo'lsa (boshqa tab) so'rov yubormaydi,
 * tabga qaytilganda esa darrov yangilaydi.
 */
export function useAutoRefresh(fn: () => void, ms = 10_000): void {
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") fn();
    };
    const id = window.setInterval(tick, ms);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [fn, ms]);
}
