// Click-to-chat links (wa.me) open WhatsApp with a pre-filled message. They
// need no Meta approval or business account, which fits the free beta; the
// trainer still presses send themselves.

/** Normalizes Turkish numbers to international digits: "0532 123 45 67" → "905321234567". */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("5")) digits = `90${digits}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

/** "905321234567" → "+90 532 123 45 67"; other countries get a plain "+" prefix. */
export function formatPhone(raw: string | null | undefined): string | null {
  const n = normalizePhone(raw);
  if (!n) return raw ?? null;
  const m = n.match(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+90 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : `+${n}`;
}

/** Appends the client's portal link to a message, when they have one. */
export const withPortal = (text: string, url: string | null | undefined) =>
  url ? `${text}\n\nDerslerin ve ödemen: ${url}` : text;

export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  const n = normalizePhone(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}

const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? fullName;

export const messages = {
  lowBalance: (name: string, remaining: number) =>
    remaining > 0
      ? `Merhaba ${firstName(name)}, paketinde ${remaining} ders kaldı. Yenilemek istersen haber ver 🙂`
      : `Merhaba ${firstName(name)}, paketindeki dersler bitti. Yeni paket için haber ver 🙂`,
  expiring: (name: string, date: string) =>
    `Merhaba ${firstName(name)}, paketinin son kullanım tarihi ${date}. Kalan derslerini planlayalım mı?`,
  paymentDue: (name: string, amount: string) =>
    `Merhaba ${firstName(name)}, paket ödemesinden kalan ${amount} tutarı hatırlatmak istedim. Teşekkürler!`,
  portalInvite: (name: string, url: string) =>
    `Merhaba ${firstName(name)}, kalan derslerini, randevularını ve ödeme durumunu buradan görebilirsin: ${url}`,
  reminder: (name: string, when: string) => `Merhaba ${firstName(name)}, ${when} dersimizi hatırlatırım. Görüşmek üzere!`,
};
