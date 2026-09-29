export const DEFAULT_TZ = "Europe/Istanbul";

const tryFormatter = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export const formatTRY = (amount: string | number) => tryFormatter.format(Number(amount));

export const formatTime = (d: Date, timeZone = DEFAULT_TZ) =>
  new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone }).format(d);

export const formatLongDate = (d: Date, timeZone = DEFAULT_TZ) =>
  new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long", timeZone }).format(d);

/** "2026-10-19" (a Postgres date) → "19 Eki" */
export const formatShortDate = (isoDate: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(isoDate));

export const SESSION_TYPE_LABELS = {
  private: "Özel",
  duet: "Düet",
  trio: "Trio",
  group: "Grup",
} as const;

export const ATTENDANCE_LABELS = {
  scheduled: "Planlı",
  attended: "Geldi",
  no_show: "Gelmedi",
  late_cancel: "Geç iptal",
  cancelled: "İptal",
} as const;

export const PAYMENT_METHOD_LABELS = {
  cash: "Nakit",
  bank_transfer: "Havale/EFT",
  card: "Kart",
  other: "Diğer",
} as const;

export function greeting(d = new Date(), timeZone = DEFAULT_TZ) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone }).format(d));
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}
