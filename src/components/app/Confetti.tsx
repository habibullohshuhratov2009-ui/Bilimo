"use client";

import { useEffect, useMemo, useState } from "react";
import Coin from "@/components/ui/Coin";

const COLORS = ["#4F46E5", "#FACC15", "#16A34A", "#F97316", "#EC4899", "#06B6D4"];

type Props = {
  count?: number;
  /** true bo'lsa — konfetti o'rniga tanga yomg'iri */
  coins?: boolean;
};

/** Yengil CSS konfetti / tanga yomg'iri. ~4s dan keyin o'zini o'chiradi. */
export default function Confetti({ count = 26, coins = false }: Props) {
  const [gone, setGone] = useState(false);

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * 100,
        delay: Math.random() * 500,
        dur: 2 + Math.random() * 1.6,
        sway: (Math.random() - 0.5) * 180,
        rot: 360 + Math.random() * 540,
        size: coins ? 18 + Math.random() * 14 : 8 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
      })),
    [count, coins]
  );

  useEffect(() => {
    const t = setTimeout(() => setGone(true), 4500);
    return () => clearTimeout(t);
  }, []);

  if (gone) return null;

  return (
    <div aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="fx-fall"
          style={
            {
              "--fx-x": `${p.x}%`,
              "--fx-delay": `${p.delay}ms`,
              "--fx-dur": `${p.dur}s`,
              "--fx-sway": `${p.sway}px`,
              "--fx-rot": `${p.rot}deg`,
            } as React.CSSProperties
          }
        >
          {coins ? (
            <Coin size={p.size} />
          ) : (
            <span
              className="block"
              style={{
                width: p.size,
                height: p.size * 0.45,
                background: p.color,
                borderRadius: p.round ? 9999 : 2,
              }}
            />
          )}
        </span>
      ))}
    </div>
  );
}
