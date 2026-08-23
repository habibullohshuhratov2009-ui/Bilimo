import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-[#4F46E5] text-white hover:bg-[#4338CA] disabled:bg-[#A5B4FC] shadow-[0_4px_0_#3730A3] active:shadow-[0_1px_0_#3730A3] active:translate-y-[3px]",
  yellow:
    "bg-[#FACC15] text-[#713F12] hover:bg-[#EAB308] disabled:opacity-50 shadow-[0_4px_0_#A16207] active:shadow-[0_1px_0_#A16207] active:translate-y-[3px]",
  outline:
    "bg-white text-[#4F46E5] border-2 border-[#DFE4FF] hover:border-[#C7D2FE] hover:bg-[#FBFCFF] disabled:opacity-50 shadow-[0_4px_0_#DBE1FD] active:shadow-[0_1px_0_#DBE1FD] active:translate-y-[3px]",
  success:
    "bg-[#16A34A] text-white hover:bg-[#15803D] disabled:opacity-50 shadow-[0_4px_0_#166534] active:shadow-[0_1px_0_#166534] active:translate-y-[3px]",
  ghost: "bg-transparent text-[#64748B] hover:text-[#0F172A] active:scale-[0.98]",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  big?: boolean;
};

export default function Button({ variant = "primary", big = false, className = "", ...props }: Props) {
  return (
    <button
      className={`${big ? "min-h-14 text-lg" : "min-h-12 text-base"} px-5 rounded-2xl font-extrabold transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
