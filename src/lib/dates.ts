// Calendar-date arithmetic on "YYYY-MM-DD" strings. These are wall-calendar
// dates in the trainer's timezone, so they are handled in UTC to avoid any
// DST or local-machine offsets creeping in.

const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);
const format = (d: Date) => d.toISOString().slice(0, 10);

export const isISODate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parse(s).getTime());

export function addDays(iso: string, days: number) {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return format(d);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export const isoWeekday = (iso: string) => parse(iso).getUTCDay() || 7;

/** Monday of the week containing `iso`. */
export const startOfWeek = (iso: string) => addDays(iso, 1 - isoWeekday(iso));

export function daysBetween(from: string, to: string) {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

/** Every date from `from` to `to`, inclusive. */
export function eachDay(from: string, to: string) {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Dates between `from` and `to` (inclusive) falling on the given ISO weekdays. */
export function recurringDates(from: string, to: string, weekdays: number[]) {
  const wanted = new Set(weekdays);
  return eachDay(from, to).filter((d) => wanted.has(isoWeekday(d)));
}

const fmt = (options: Intl.DateTimeFormatOptions) => {
  const f = new Intl.DateTimeFormat("tr-TR", { ...options, timeZone: "UTC" });
  return (iso: string) => f.format(parse(iso));
};

/** "Pzt" */
export const weekdayShort = fmt({ weekday: "short" });
/** "29 Eylül Salı" */
export const dayLong = fmt({ day: "numeric", month: "long", weekday: "long" });
/** "29 Eyl" */
export const dayShort = fmt({ day: "numeric", month: "short" });
/** "29" */
export const dayOfMonth = fmt({ day: "numeric" });

/** "29 Eyl – 5 Eki" */
export const weekRangeLabel = (monday: string) => `${dayShort(monday)} – ${dayShort(addDays(monday, 6))}`;

export const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

/** [2, 4] → "Sal, Per" (ISO weekdays, Monday first). */
export const weekdayList = (weekdays: number[]) =>
  [...weekdays]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_LABELS[d - 1])
    .join(", ");
