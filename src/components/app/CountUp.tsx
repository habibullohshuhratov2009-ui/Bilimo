"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
};

/** Raqamni 0 (yoki oldingi qiymat)dan yangi qiymatga silliq sanaydi. */
export default function CountUp({ value, duration = 900, decimals = 0, className = "" }: Props) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || from === to) {
      setDisplay(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // strong ease-out
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display)}
    </span>
  );
}
