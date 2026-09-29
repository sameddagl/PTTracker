import { addDays } from "./dates";
import { formatTime, todayISO } from "./format";

const WEEKDAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

/** "bugün 18:00", "yarın 10:00" or "Perşembe 09:30", in the trainer's timezone. */
export function whenPhrase(d: Date, timeZone: string, now = new Date()) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
  const today = todayISO(timeZone, now);
  const time = formatTime(d, timeZone);
  if (day === today) return `bugün ${time}`;
  if (day === addDays(today, 1)) return `yarın ${time}`;
  const dow = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
  return `${WEEKDAYS[dow]} ${time}`;
}
