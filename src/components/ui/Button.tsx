import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:bg-[#A5B4FC] shadow-[0_4px_0_#3730A3] active:shadow-none active:translate-y-1",
  yellow:
    "bg-[#FACC15] text-[#0F172A] hover:bg-[#EAB308] disabled:opacity-50 shadow-[0_4px_0_#CA8A04] active:shadow-none active:translate-y-1",
  outline:
    "bg-white text-[#4F46E5] border-2 border-[#4F46E5] hover:bg-indigo-50 disabled:opacity-50",
  success:
    "bg-[#16A34A] text-white hover:bg-[#15803D] disabled:opacity-50 shadow-[0_4px_0_#166534] active:shadow-none active:translate-y-1",
  ghost: "bg-transparent text-[#64748B] hover:text-[#0F172A]",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  big?: boolean;
};

export default function Button({ variant = "primary", big = false, className = "", ...props }: Props) {
  return (
    <button
      className={`${big ? "min-h-14 text-lg" : "min-h-12 text-base"} px-5 rounded-2xl font-bold transition-all disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
