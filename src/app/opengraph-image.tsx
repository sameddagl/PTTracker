import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/config";

// Default share image (WhatsApp, Instagram DMs, X). Trainer pages use their own cover photo.
export const alt = `${APP_NAME} · Pilates ve PT eğitmenleri için danışan ve seans takibi`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f5f5f7", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "#c6f24e", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 64 64" width={56} height={56}>
              <path d="M12 32h8l6-18 12 36 6-18h8" fill="none" stroke="#1d1d1f" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, color: "#1d1d1f", letterSpacing: -1 }}>{APP_NAME}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 76, fontWeight: 700, color: "#1d1d1f", letterSpacing: -3, lineHeight: 1.05 }}>Seanslar, paketler, ödemeler.</div>
          <div style={{ fontSize: 76, fontWeight: 700, color: "#6e6e73", letterSpacing: -3, lineHeight: 1.05 }}>Hepsi tek yerde.</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["Pilates ve PT eğitmenleri için", "Beta süresince ücretsiz"].map((t) => (
            <div key={t} style={{ display: "flex", fontSize: 28, color: "#1d1d1f", background: "#ffffff", border: "1px solid #e6e6ea", borderRadius: 999, padding: "12px 28px" }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
