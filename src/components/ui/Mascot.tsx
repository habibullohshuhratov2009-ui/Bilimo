/**
 * Zumi — Sinf AI maskoti. Yumaloq "aql sharchasi": ko'zlari pirpiraydi,
 * salomlashadi (happy), o'ylaydi (think), g'alabada sakraydi (win).
 * Sof SVG + CSS animatsiya (globals.css: m-eye, m-arm-wave, m-bob, m-jump, m-spark, m-think).
 */
type Mood = "happy" | "think" | "win";

export default function Mascot({
  mood = "happy",
  size = 120,
  className = "",
  animated = true,
}: {
  mood?: Mood;
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  const wrap = animated
    ? mood === "win"
      ? "m-jump"
      : mood === "think"
        ? "m-think"
        : "m-bob"
    : "";
  const eye = animated ? "m-eye" : "";
  const spark = animated ? "m-spark" : "";

  return (
    <span className={`inline-block ${wrap} ${className}`} style={{ lineHeight: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        role="img"
        aria-label="Zumi — Sinf AI maskoti"
      >
        <defs>
          <radialGradient id="zumi-body" cx="38%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="55%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </radialGradient>
          <radialGradient id="zumi-coin" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#eab308" />
          </radialGradient>
        </defs>

        {/* soya */}
        <ellipse cx="60" cy="111" rx="26" ry="5" fill="#4f46e5" opacity="0.15" />

        {/* antenna + oltin uchqun */}
        <path d="M60 22 L60 12" stroke="#4338ca" strokeWidth="3.5" strokeLinecap="round" />
        <g className={spark}>
          <path
            d="M60 2 l2.6 5.4 5.9 0.9 -4.3 4.2 1 5.9 -5.2 -2.8 -5.2 2.8 1 -5.9 -4.3 -4.2 5.9 -0.9 z"
            fill="url(#zumi-coin)"
            stroke="#ca8a04"
            strokeWidth="1"
          />
        </g>

        {/* qo'llar */}
        {mood === "win" ? (
          <>
            <path d="M22 62 Q10 46 18 36" stroke="#4f46e5" strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M98 62 Q110 46 102 36" stroke="#4f46e5" strokeWidth="7" strokeLinecap="round" fill="none" />
          </>
        ) : mood === "think" ? (
          <>
            <path d="M24 70 Q14 78 20 86" stroke="#4f46e5" strokeWidth="7" strokeLinecap="round" fill="none" />
            {/* qo'l iyakda */}
            <path d="M96 72 Q100 84 84 88" stroke="#4f46e5" strokeWidth="7" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <path d="M24 70 Q14 78 20 86" stroke="#4f46e5" strokeWidth="7" strokeLinecap="round" fill="none" />
            <g className={animated ? "m-arm-wave" : ""}>
              <path d="M97 66 Q110 56 106 44" stroke="#4f46e5" strokeWidth="7" strokeLinecap="round" fill="none" />
              <circle cx="106" cy="42" r="5" fill="#6366f1" />
            </g>
          </>
        )}

        {/* tana */}
        <circle cx="60" cy="66" r="40" fill="url(#zumi-body)" />
        <ellipse cx="47" cy="48" rx="14" ry="9" fill="#ffffff" opacity="0.22" />

        {/* yuz */}
        {mood === "win" ? (
          <>
            {/* yulduz-ko'zlar */}
            <path d="M46 58 l2.2 4.4 4.9 0.7 -3.5 3.4 0.8 4.9 -4.4 -2.3 -4.4 2.3 0.8 -4.9 -3.5 -3.4 4.9 -0.7 z" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
            <path d="M74 58 l2.2 4.4 4.9 0.7 -3.5 3.4 0.8 4.9 -4.4 -2.3 -4.4 2.3 0.8 -4.9 -3.5 -3.4 4.9 -0.7 z" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
            <path d="M50 82 Q60 92 70 82" stroke="#1e1b4b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </>
        ) : mood === "think" ? (
          <>
            {/* yuqoriga qaragan ko'zlar */}
            <g className={eye}>
              <circle cx="46" cy="63" r="8.5" fill="#ffffff" />
              <circle cx="48" cy="59.5" r="4" fill="#1e1b4b" />
            </g>
            <g className={eye}>
              <circle cx="74" cy="63" r="8.5" fill="#ffffff" />
              <circle cx="76" cy="59.5" r="4" fill="#1e1b4b" />
            </g>
            <path d="M53 84 Q60 80 67 84" stroke="#1e1b4b" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            {/* savol pufagi */}
            <circle cx="103" cy="20" r="12" fill="#ffffff" stroke="#c7d2fe" strokeWidth="1.5" />
            <text x="103" y="26" textAnchor="middle" fontSize="15" fontWeight="800" fill="#4f46e5" fontFamily="Arial, sans-serif">?</text>
          </>
        ) : (
          <>
            <g className={eye}>
              <circle cx="46" cy="63" r="8.5" fill="#ffffff" />
              <circle cx="47.5" cy="64.5" r="4.2" fill="#1e1b4b" />
              <circle cx="49" cy="62.5" r="1.4" fill="#ffffff" />
            </g>
            <g className={eye}>
              <circle cx="74" cy="63" r="8.5" fill="#ffffff" />
              <circle cx="75.5" cy="64.5" r="4.2" fill="#1e1b4b" />
              <circle cx="77" cy="62.5" r="1.4" fill="#ffffff" />
            </g>
            <path d="M50 80 Q60 89 70 80" stroke="#1e1b4b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* yonoqlar */}
        <ellipse cx="36" cy="74" rx="5" ry="3.4" fill="#fb7185" opacity="0.45" />
        <ellipse cx="84" cy="74" rx="5" ry="3.4" fill="#fb7185" opacity="0.45" />

        {/* oyoqlar */}
        <ellipse cx="47" cy="106" rx="8" ry="4.5" fill="#4338ca" />
        <ellipse cx="73" cy="106" rx="8" ry="4.5" fill="#4338ca" />
      </svg>
    </span>
  );
}
