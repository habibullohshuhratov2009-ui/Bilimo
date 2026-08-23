import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Sinf AI — maktab o'quvchilari uchun AI repetitor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1E1B4B 0%, #4F46E5 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 160,
            height: 160,
            borderRadius: 9999,
            background: "#FACC15",
            border: "8px solid #CA8A04",
            color: "#713F12",
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          SA
        </div>
        <div style={{ marginTop: 36, fontSize: 76, fontWeight: 800 }}>
          Sinf AI
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 34,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          Maktab o&apos;quvchilari uchun AI repetitor — o&apos;zbek tilida
        </div>
        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 18,
            fontSize: 26,
            color: "#FACC15",
            fontWeight: 700,
          }}
        >
          <span>🧠 Qadam-baqadam</span>
          <span>🪙 Tanga</span>
          <span>⚔️ Duel</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
