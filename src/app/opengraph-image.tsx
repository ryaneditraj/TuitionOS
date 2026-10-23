import { ImageResponse } from "next/og";

export const alt = "Trinity One, a mobile-first operating system for tuition centres";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f172a",
          color: "white",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            T1
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#c7d2fe", fontWeight: 700 }}>
            Tuition centre operating system
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>Trinity One</div>
          <div style={{ fontSize: 32, color: "#cbd5e1", maxWidth: 860 }}>
            Today’s classes, homework, attendance, and board-exam notes on one screen.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
