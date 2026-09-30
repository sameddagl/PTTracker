"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Last resort when the root layout itself fails: report it and offer a reload.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="tr">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0, padding: 16 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Bir şeyler ters gitti</h1>
          <p style={{ margin: "0 0 16px", color: "#6b6b70" }}>Sorunu gördük. Sayfayı yenileyip tekrar dene.</p>
          <button type="button" onClick={() => location.reload()} style={{ padding: "12px 20px", borderRadius: 999, border: 0, background: "#1d1d1f", color: "#fff", fontSize: 16 }}>
            Sayfayı yenile
          </button>
        </div>
      </body>
    </html>
  );
}
