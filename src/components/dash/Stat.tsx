"use client";

import type { ReactNode } from "react";
import CountUp from "@/components/app/CountUp";

type Props = {
  icon: ReactNode;
  value: number;
  label: string;
  /** "%" kabi qo'shimcha — raqamdan keyin turadi */
  suffix?: string;
  tone?: "indigo" | "coin" | "mint" | "rose";
};

const TONES = {
  indigo: "bg-[#EEF2FF] text-[#4F46E5]",
  coin: "bg-[#FEF9C3] text-[#A16207]",
  mint: "bg-[#DCFCE7] text-[#15803D]",
  rose: "bg-[#FFE4E6] text-[#BE123C]",
} as const;

/** Dashboard KPI plitkasi: ikonka + raqam + izoh. */
export default function Stat({ icon, value, label, suffix, tone = "indigo" }: Props) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${TONES[tone]}`}>{icon}</span>
      <p className="mt-3 flex items-baseline gap-0.5 text-2xl font-extrabold leading-none">
        <CountUp value={value} duration={900} />
        {suffix && <span>{suffix}</span>}
      </p>
      <p className="mt-1 text-xs font-semibold text-[#64748B]">{label}</p>
    </div>
  );
}
