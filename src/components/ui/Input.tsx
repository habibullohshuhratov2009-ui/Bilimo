import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };

export default function Input({ label, className = "", ...props }: Props) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#334155] mb-1.5">{label}</span>
      <input
        className={`w-full min-h-12 px-4 rounded-2xl border-2 border-slate-200 bg-white text-[#0F172A] text-base outline-none transition-colors focus:border-[#4F46E5] placeholder:text-slate-400 ${className}`}
        {...props}
      />
    </label>
  );
}
