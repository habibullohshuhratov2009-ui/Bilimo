"use client";

import type { ReactNode } from "react";

type Props = { show: boolean; children: ReactNode };

/** Pastdan chiqadigan qisqa bildirishnoma. */
export default function Toast({ show, children }: Props) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="fx-toast bg-[#0F172A] text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
        {children}
      </div>
    </div>
  );
}
