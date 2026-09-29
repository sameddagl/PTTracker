// Bookable time slots from weekly working hours, minus what's already taken.
// Pure and timezone-free: every date and minute is in the trainer's local time.

import { addDays, isoWeekday } from "./dates";

export type Rule = { weekday: number; startMinute: number; endMinute: number };
export type Busy = { date: string; startMinute: number; endMinute: number };
export type DayOff = { startsOn: string; endsOn: string };
export type DaySlots = { date: string; minutes: number[] };

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const toHHMM = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/**
 * Slots start at the beginning of each working range and follow each other
 * back to back (09:00, 10:00, … for 60-minute lessons). A slot is offered
 * when the whole lesson fits in the range, overlaps no busy lesson, isn't on
 * a day off, and starts at least `minNoticeMinutes` from now.
 */
export function computeSlots({
  rules,
  busy,
  daysOff,
  today,
  nowMinute,
  horizonDays,
  lessonMinutes,
  minNoticeMinutes,
  lastDate,
}: {
  rules: Rule[];
  busy: Busy[];
  daysOff: DayOff[];
  today: string;
  nowMinute: number;
  horizonDays: number;
  lessonMinutes: number;
  minNoticeMinutes: number;
  /** Optional cut-off, e.g. the package's expiry date. */
  lastDate?: string | null;
}): DaySlots[] {
  const out: DaySlots[] = [];
  const earliest = { date: today, minute: nowMinute + minNoticeMinutes };
  // Notice periods can roll over midnight (e.g. 23:00 + 12h).
  while (earliest.minute >= 1440) {
    earliest.date = addDays(earliest.date, 1);
    earliest.minute -= 1440;
  }

  for (let i = 0; i <= horizonDays; i++) {
    const date = addDays(today, i);
    if (lastDate && date > lastDate) break;
    if (daysOff.some((d) => date >= d.startsOn && date <= d.endsOn)) continue;

    const dayBusy = busy.filter((b) => b.date === date);
    const minutes: number[] = [];
    for (const r of rules.filter((r) => r.weekday === isoWeekday(date)).sort((a, b) => a.startMinute - b.startMinute)) {
      for (let start = r.startMinute; start + lessonMinutes <= r.endMinute; start += lessonMinutes) {
        const end = start + lessonMinutes;
        if (date < earliest.date || (date === earliest.date && start < earliest.minute)) continue;
        if (dayBusy.some((b) => b.startMinute < end && b.endMinute > start)) continue;
        if (!minutes.includes(start)) minutes.push(start);
      }
    }
    if (minutes.length > 0) out.push({ date, minutes: minutes.sort((a, b) => a - b) });
  }
  return out;
}
