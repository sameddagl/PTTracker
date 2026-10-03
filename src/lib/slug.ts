// Public page addresses: /<slug>. Must match the trainers_slug_format check.

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

// Top-level paths the app uses (or may use); a trainer can't claim them.
const RESERVED = new Set([
  "acik-riza", "admin", "api", "app", "auth", "ayarlar", "baslangic", "bugun", "danisan", "danisanlar", "ders", "destek",
  "fiyatlar", "giris", "gizlilik", "hakkimizda", "help", "icon", "kayit", "kosullar", "kvkk", "login", "manifest", "mesajlar", "odemeler",
  "p", "paketler", "pwa-icon", "sozlesme", "takvim", "www", "yardim", "yazdir", "yoklama", "yonetim", "davet", "hakedis", "ekip",
  // Marketing pages planned in docs/seo-audit/ACTION-PLAN.md.
  "alternatif", "blog", "hakkinda", "iletisim", "karsilastirma", "monitoring", "online-randevu", "ozellikler", "personal-trainer",
  "pilates", "pilates-egitmenleri", "rehber", "sablonlar",
]);

const TR_MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", i̇: "i", ö: "o", ş: "s", ü: "u" };

/** "Samed Hoca Pilates" → "samed-hoca-pilates" */
export function toSlug(input: string) {
  return input
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]|i̇/g, (c) => TR_MAP[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");
}

export function slugError(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug)) return "3–30 karakter; küçük harf, rakam ve tire kullan.";
  if (slug.includes("--")) return "Arka arkaya iki tire kullanılamaz.";
  if (RESERVED.has(slug)) return "Bu adres kullanılamıyor.";
  return null;
}
