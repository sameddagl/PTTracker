import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AttendanceRow } from "@/components/attendance-row";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { withTrainer } from "@/db";
import { getLessons, type CalendarLesson } from "@/db/lessons";
import { getTrainer } from "@/db/queries";
import { addDays, dayLong } from "@/lib/dates";
import { SESSION_TYPE_LABELS, formatTime, todayISO } from "@/lib/format";
import { AllAttended } from "./all-attended";

export const metadata: Metadata = { title: "Yoklama" };

/** How far back unmarked lessons are collected. */
const LOOKBACK_DAYS = 14;

export default async function AttendancePage() {
  const { trainer, lessons } = await withTrainer(async (tx, trainerId, member) => {
    const trainer = await getTrainer(tx, trainerId);
    const today = todayISO(trainer.timezone);
    // An instructor takes attendance for their own lessons only.
    const lessons = await getLessons(tx, trainer, { from: addDays(today, -LOOKBACK_DAYS), to: today, instructorId: member.role === "owner" ? null : member.id });
    return { trainer, lessons };
  });

  const now = new Date();
  const tz = trainer.timezone;
  const today = todayISO(tz);
  const waiting = (l: CalendarLesson) => l.attendees.filter((a) => a.status === "scheduled");
  // Started lessons with someone still unmarked, newest first; then the rest of today.
  const pending = lessons.filter((l) => l.startsAt <= now && waiting(l).length > 0).reverse();
  const later = lessons.filter((l) => l.startsAt > now && l.localDate === today);

  const byDay = new Map<string, CalendarLesson[]>();
  for (const l of pending) byDay.set(l.localDate, [...(byDay.get(l.localDate) ?? []), l]);

  return (
    <>
      <PageHeader
        title="Yoklama"
        description={`Son ${LOOKBACK_DAYS} günde yoklaması alınmayan dersler. Geldi ya da Gelmedi işaretlediğin ders paketten düşer.`}
      />

      {pending.length === 0 ? (
        <EmptyState icon={<CheckCircle2 />} title="Bekleyen yoklama yok">
          Başlayan bütün derslerin yoklaması alındı.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-8">
          {[...byDay.entries()].map(([day, list]) => (
            <section key={day} aria-labelledby={`day-${day}`}>
              <h2 id={`day-${day}`} className="mb-3 flex items-center gap-2 text-base font-semibold capitalize">
                {day === today ? "Bugün" : day === addDays(today, -1) ? "Dün" : dayLong(day)}
                <Badge variant="lime" className="tabular-nums">
                  {list.reduce((n, l) => n + waiting(l).length, 0)}
                </Badge>
              </h2>
              <ul className="flex flex-col gap-3">
                {list.map((l) => (
                  <LessonCard key={l.lessonId} lesson={l} tz={tz} waitingIds={waiting(l).map((a) => a.id)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {later.length > 0 && (
        <section aria-labelledby="later-heading" className="mt-8">
          <h2 id="later-heading" className="mb-3 text-base font-semibold">
            Bugünün kalan dersleri
          </h2>
          <ul className="divide-y overflow-hidden surface">
            {later.map((l) => (
              <li key={l.lessonId}>
                <Link href={`/ders/${l.lessonId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <span className="w-12 text-sm font-semibold tabular-nums">{formatTime(l.startsAt, tz)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{l.attendees.map((a) => a.name).join(", ") || "Katılan yok"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function LessonCard({ lesson: l, tz, waitingIds }: { lesson: CalendarLesson; tz: string; waitingIds: string[] }) {
  return (
    <li className="flex flex-col gap-4 surface p-4">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/ders/${l.lessonId}`} className="min-w-0 hover:underline">
          <span className="font-semibold tabular-nums">
            {formatTime(l.startsAt, tz)}–{formatTime(l.endsAt, tz)}
          </span>
          <span className="ml-2 text-sm text-muted-foreground">{l.groupClassId ? (l.title ?? "Grup dersi") : SESSION_TYPE_LABELS[l.sessionType]}</span>
        </Link>
        {waitingIds.length > 1 && <AllAttended attendeeIds={waitingIds} />}
      </div>
      <div className="flex flex-col gap-4">
        {l.attendees.map((a) => (
          <AttendanceRow key={`${a.id}:${a.status}`} attendee={a} />
        ))}
      </div>
    </li>
  );
}
