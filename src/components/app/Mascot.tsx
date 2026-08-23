type Mood = "hello" | "happy" | "thinking";

type Props = { mood?: Mood; size?: number };

/** Blimo maskoti — do'stona robot. Qo'l silkitadi, ko'z pirpiratadi. */
export default function Mascot({ mood = "hello", size = 96 }: Props) {
  return (
    <span
      className={`inline-block ${mood === "happy" ? "fx-mascot-jump" : ""}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        {/* antenna */}
        <line x1="60" y1="20" x2="60" y2="10" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" />
        <circle cx="60" cy="8" r="5" fill="#FACC15" className={mood === "thinking" ? "fx-antenna" : ""} />
        {/* quloqlar */}
        <rect x="20" y="36" width="8" height="16" rx="4" fill="#6D28D9" />
        <rect x="92" y="36" width="8" height="16" rx="4" fill="#6D28D9" />
        {/* bosh */}
        <rect x="28" y="20" width="64" height="50" rx="16" fill="#4F46E5" />
        <rect x="38" y="31" width="44" height="28" rx="10" fill="#EEF2FF" />
        {/* ko'zlar */}
        <g className="fx-blink">
          <circle cx="52" cy="43" r="5" fill="#0F172A" />
          <circle cx="68" cy="43" r="5" fill="#0F172A" />
        </g>
        {/* og'iz */}
        {mood === "happy" ? (
          <path d="M49 50 Q60 60 71 50" stroke="#0F172A" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M53 52 Q60 56 67 52" stroke="#0F172A" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        {/* tana */}
        <rect x="38" y="74" width="44" height="30" rx="12" fill="#6D28D9" />
        <circle cx="60" cy="89" r="7" fill="#FACC15" />
        {/* chap qo'l */}
        <rect x="24" y="78" width="10" height="22" rx="5" fill="#4F46E5" />
        {/* o'ng qo'l — silkitadi */}
        <g className="fx-wave-arm">
          <rect x="86" y="62" width="10" height="30" rx="5" fill="#4F46E5" transform="rotate(-28 91 92)" />
        </g>
      </svg>
    </span>
  );
}
