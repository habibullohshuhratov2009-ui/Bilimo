/** Zerikarli aylana emas — aylanayotgan tanga. API o'zgarmagan: <Spinner size={28} /> */
export default function Spinner({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-label="Yuklanmoqda"
      className="animate-coin-spin inline-block"
      style={{ width: size, height: size, perspective: "200px" }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="7.5" fill="none" stroke="#CA8A04" strokeWidth="1.2" opacity="0.6" />
        <path
          d="M12 7.2l1.35 2.74 3.02.44-2.18 2.13.51 3.01L12 14.1l-2.7 1.42.51-3.01-2.18-2.13 3.02-.44L12 7.2z"
          fill="#CA8A04"
          opacity="0.85"
        />
      </svg>
    </span>
  );
}
