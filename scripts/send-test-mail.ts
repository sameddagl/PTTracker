// Sends one test email through the app's own SMTP settings and layout.
// Usage: pnpm mail:test you@example.com
import { layout, sendMail } from "../src/lib/mail";

const to = process.argv[2];
if (!to) {
  console.error("Kullanım: pnpm mail:test alici@ornek.com");
  process.exit(1);
}

const { html, text } = layout({
  heading: "Test e-postası",
  lines: [
    "Bu e-posta Stüdyom'un SMTP ayarlarını denemek için gönderildi.",
    "Bunu okuyabiliyorsan başvuru, onay ve randevu bildirimleri de gönderilebilir.",
  ],
});
sendMail({ to, subject: "Stüdyom · SMTP testi", html, text }).then((ok) => {
  console.log(ok ? `Gönderildi: ${to}` : "Gönderilemedi (ayrıntı yukarıda)");
  process.exit(ok ? 0 : 1);
});
