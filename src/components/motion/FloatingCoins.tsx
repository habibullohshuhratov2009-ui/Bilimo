/**
 * Dekorativ suzuvchi tangalar — fon uchun. Sof CSS (float + scroll-parallaks).
 * pointer-events yo'q, reduced-motion da to'xtaydi (globals.css).
 */
function MiniCoin({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="#CA8A04" strokeWidth="1.2" opacity="0.6" />
      <path
        d="M12 7.2l1.35 2.74 3.02.44-2.18 2.13.51 3.01L12 14.1l-2.7 1.42.51-3.01-2.18-2.13 3.02-.44L12 7.2z"
        fill="#CA8A04"
        opacity="0.85"
      />
    </svg>
  );
}

const SPOTS = [
  { top: "3%", left: "3%", size: 24, cls: "animate-float parallax-up", opacity: 0.55 },
  { top: "24%", right: "8%", size: 34, cls: "animate-float-slow parallax-down", opacity: 0.8 },
  { top: "64%", left: "3%", size: 18, cls: "animate-float-slow parallax-up", opacity: 0.45 },
  { top: "70%", right: "14%", size: 24, cls: "animate-float parallax-up", opacity: 0.6 },
  { top: "44%", right: "3%", size: 15, cls: "animate-float-slow parallax-down", opacity: 0.35 },
] as const;

export default function FloatingCoins({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {SPOTS.map((s, i) => (
        <span
          key={i}
          className={`absolute ${s.cls}`}
          style={{
            top: s.top,
            left: "left" in s ? s.left : undefined,
            right: "right" in s ? s.right : undefined,
            opacity: s.opacity,
          }}
        >
          <MiniCoin size={s.size} />
        </span>
      ))}
    </div>
  );
}
