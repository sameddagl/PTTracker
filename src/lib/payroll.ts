import type { PayRule } from "@/db/schema";

// Instructor pay ("hakediş") for one month. A lesson counts when at least one
// client came (and, if the studio says so, when a client cancelled late or
// didn't show). Per-lesson pay is a fixed amount by lesson type; percentage
// pay is a share of what the lesson was worth: each counted client's package
// price divided by its number of lessons. Clients without a package add nothing.

export type SessionType = "private" | "duet" | "trio" | "group";
export type AttendeeStatus = "scheduled" | "attended" | "no_show" | "late_cancel" | "cancelled";

export type PayrollLessonInput = {
  id: string;
  startsAt: Date;
  sessionType: SessionType;
  attendees: { status: AttendeeStatus; packagePrice: number | null; packageLessons: number | null }[];
};

export type PayrollLine = { lessonId: string; startsAt: string; sessionType: SessionType; clients: number; value: number; pay: number };

export type PayrollSummary = {
  lessons: number;
  byType: Record<SessionType, number>;
  amount: number;
  lines: PayrollLine[];
};

const round = (n: number) => Math.round(n * 100) / 100;

export const SESSION_LABELS: Record<SessionType, string> = { private: "Özel", duet: "Düet", trio: "Trio", group: "Grup" };

export function computePayroll(lessons: PayrollLessonInput[], rule: PayRule | null, countsMissed: boolean): PayrollSummary {
  const byType: Record<SessionType, number> = { private: 0, duet: 0, trio: 0, group: 0 };
  const lines: PayrollLine[] = [];
  for (const l of lessons) {
    const counted = l.attendees.filter((a) => a.status === "attended" || (countsMissed && (a.status === "late_cancel" || a.status === "no_show")));
    if (counted.length === 0) continue;
    const value = round(counted.reduce((sum, a) => sum + (a.packagePrice && a.packageLessons ? a.packagePrice / a.packageLessons : 0), 0));
    const pay = !rule ? 0 : rule.type === "per_lesson" ? (rule[l.sessionType] ?? 0) : round((value * rule.percent) / 100);
    byType[l.sessionType]++;
    lines.push({ lessonId: l.id, startsAt: l.startsAt.toISOString(), sessionType: l.sessionType, clients: counted.length, value, pay });
  }
  lines.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return { lessons: lines.length, byType, amount: round(lines.reduce((s, l) => s + l.pay, 0)), lines };
}

/** "Özel 600 ₺ · Grup 900 ₺" or "%40", for the team list. */
export function payRuleLabel(rule: PayRule | null, formatTRY: (n: number) => string) {
  if (!rule) return "Ücret kuralı yok";
  if (rule.type === "percent") return `Ders değerinin %${rule.percent}'ı`;
  const parts = (["private", "duet", "trio", "group"] as const).filter((t) => rule[t] > 0).map((t) => `${SESSION_LABELS[t]} ${formatTRY(rule[t])}`);
  return parts.length ? `Ders başı · ${parts.join(" · ")}` : "Ücret kuralı yok";
}

/** "2026-10" → first and first-of-next-month dates. */
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return { from: `${month}-01`, to: `${next}-01` };
}

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
