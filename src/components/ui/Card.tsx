import type { HTMLAttributes } from "react";

export default function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.06)] p-4 ${className}`}
      {...props}
    />
  );
}
