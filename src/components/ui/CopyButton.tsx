"use client";

import { useState } from "react";

type Props = {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

export default function CopyButton({
  text,
  label = "Nusxalash",
  copiedLabel = "Nusxalandi ✓",
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={onCopy}
      className={`min-h-12 px-5 rounded-2xl font-bold text-base transition-colors ${
        copied
          ? "bg-[#16A34A] text-white"
          : "bg-white text-[#4F46E5] border-2 border-[#4F46E5] hover:bg-indigo-50"
      } ${className}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
