import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getLessons, type CalendarLesson } from "@/db/lessons";
import { getTrainer } from "@/db/queries";
import {
  WEEKDAY_LABELS,
  addDays,
  dayLong,
  dayOfMonth,
  eachDay,
  isISODate,
  startOfWeek,
  weekRangeLabel,
} from "@/lib/dates";
import { SESSION_TYPE_LABELS, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TONE_CLASSES, TONE_LABELS, layoutDay, lessonTitle, lessonTone, minutesToTime } from "./lesson-summary";

export const metadata: Metadata = { title: "Takvim" };

const HOUR_PX = 56;

export default async function CalendarPage({ searchParams }: PageProps<"/takvim">) {
  const { hafta, gun } = await searchParams;

  const { trainer, lessons, today, monday } = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    const today = todayISO(trainer.timezone);
    const monday = startOfWeek(isISODate(gun) ? gun : isISODate(hafta) ? hafta : today);
    const lessons = await getLessons(tx, trainer, { from: monday, to: addDays(monday, 6), includeCancelled: true });
    return { trainer, lessons, today, monday };
  });

  const days = eachDay(monday, addDays(monday, 6));
  const selected = isISODate(gun) && days.includes(gun) ? gun : days.includes(today) ? today : monday;
  const byDay = new Map(days.map((d) => [d, lessons.filter((l) => l.localDate === d)]));

  const weekHref = (m: string) => `/takvim?hafta=${m}`;
  const dayHref = (d: string) => `/takvim?hafta=${monday}&gun=${d}`;
  const back = encodeURIComponent(dayHref(selected));

  return (
    <>
      <PageHeader
        title="Takvim"
        action={
          <Button asChild>
            <Link href={`/ders/yeni?tarih=${selected}&next=${back}`}>
              <CalendarPlus />
              <span className="max-sm:sr-only">Ders ekle</span>
            </Link>
          </Button>
        }
      />

      <nav aria-label="Hafta" className="mb-4 flex items-center gap-2">
        <Button asChild variant="outline" size="icon" aria-label="Önceki hafta">
          <Link href={weekHref(addDays(monday, -7))} scroll={false}>
            <ChevronLeft />
          </Link>
        </Button>
        <span className="min-w-0 flex-1 text-center text-sm font-medium tabular-nums">{weekRangeLabel(monday)}</span>
        <Button asChild variant="outline" size="icon" aria-label="Sonraki hafta">
          <Link href={weekHref(addDays(monday, 7))} scroll={false}>
            <ChevronRight />
          </Link>
        </Button>
        {!days.includes(today) && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/takvim" scroll={false}>
              Bugün
            </Link>
          </Button>
        )}
      </nav>

      {/* Phones: day strip + agenda */}
      <div className="md:hidden">
        <ol className="mb-4 grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const count = byDay.get(d)!.filter((l) => l.lessonStatus === "scheduled").length;
            return (
              <li key={d}>
                <Link
                  href={dayHref(d)}
                  scroll={false}
                  aria-current={d === selected ? "date" : undefined}
                  aria-label={`${dayLong(d)}, ${count} ders`}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg py-2 text-xs transition-colors",
                    d === selected ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                    d === today && d !== selected && "text-primary",
                  )}
                >
                  <span className={d === selected ? "" : "text-muted-foreground"}>{WEEKDAY_LABELS[i]}</span>
                  <span className="text-base font-semibold tabular-nums">{dayOfMonth(d)}</span>
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      count === 0 ? "bg-transparent" : d === selected ? "bg-primary-foreground" : "bg-primary",
                    )}
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ol>

        <h2 className="mb-3 text-sm font-medium text-muted-foreground">{dayLong(selected)}</h2>
        <DayAgenda lessons={byDay.get(selected)!} addHref={`/ders/yeni?tarih=${selected}&next=${back}`} />
      </div>

      {/* Tablets and up: week grid */}
      <WeekGrid days={days} byDay={byDay} today={today} timezone={trainer.timezone} back={back} />
    </>
  );
}

function LessonCard({ lesson: l }: { lesson: CalendarLesson }) {
  const tone = lessonTone(l);
  return (
    <Link
      href={`/ders/${l.lessonId}`}
      className={cn("flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors", TONE_CLASSES[tone])}
    >
      <div className="w-12 shrink-0">
        <div className="font-semibold tabular-nums">{minutesToTime(l.startMinute)}</div>
        <div className="text-xs text-muted-foreground tabular-nums">{minutesToTime(l.startMinute + l.durationMinutes)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{lessonTitle(l)}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {SESSION_TYPE_LABELS[l.sessionType]} · {TONE_LABELS[tone]}
          {l.seriesId && <Repeat className="size-3" aria-label="Tekrarlayan" />}
        </p>
      </div>
    </Link>
  );
}

function DayAgenda({ lessons, addHref }: { lessons: CalendarLesson[]; addHref: string }) {
  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">Bu gün ders yok.</p>
        <Button asChild variant="outline" size="sm">
          <Link href={addHref}>
            <CalendarPlus />
            Ders ekle
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {lessons.map((l) => (
        <li key={l.lessonId}>
          <LessonCard lesson={l} />
        </li>
      ))}
    </ul>
  );
}

function WeekGrid({
  days,
  byDay,
  today,
  timezone,
  back,
}: {
  days: string[];
  byDay: Map<string, CalendarLesson[]>;
  today: string;
  timezone: string;
  back: string;
}) {
  const all = [...byDay.values()].flat();
  // 07:00–21:00 by default, stretched to fit any earlier or later lesson.
  const firstHour = Math.min(7, ...all.map((l) => Math.floor(l.startMinute / 60)));
  const lastHour = Math.max(21, ...all.map((l) => Math.ceil((l.startMinute + l.durationMinutes) / 60)));
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);

  const nowParts = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "numeric", hourCycle: "h23", timeZone: timezone })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  const nowMinute = Number(nowParts.hour) * 60 + Number(nowParts.minute);

  return (
    <div data-wide className="hidden overflow-hidden rounded-xl border md:block">
      <div className="grid grid-cols-[3rem_repeat(7,1fr)] border-b bg-muted/30">
        <div />
        {days.map((d, i) => (
          <div key={d} className={cn("border-l px-2 py-2 text-center text-xs", d === today && "text-primary")}>
            <span className="text-muted-foreground">{WEEKDAY_LABELS[i]}</span>{" "}
            <span className="font-semibold tabular-nums">{dayOfMonth(d)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[3rem_repeat(7,1fr)]">
        <div>
          {hours.map((h) => (
            <div key={h} style={{ height: HOUR_PX }} className="pr-2 text-right text-[11px] text-muted-foreground tabular-nums">
              <span className="relative -top-2">{h > firstHour ? `${String(h).padStart(2, "0")}:00` : ""}</span>
            </div>
          ))}
        </div>
        {days.map((d) => (
          <div key={d} className={cn("relative border-l", d === today && "bg-primary/[0.03]")}>
            {hours.map((h) => (
              <Link
                key={h}
                href={`/ders/yeni?tarih=${d}&saat=${String(h).padStart(2, "0")}:00&next=${back}`}
                aria-label={`${dayLong(d)} ${String(h).padStart(2, "0")}:00 ders ekle`}
                style={{ height: HOUR_PX }}
                className="block border-b border-dashed border-border/60 transition-colors hover:bg-muted/40"
              />
            ))}
            {d === today && nowMinute >= firstHour * 60 && nowMinute <= lastHour * 60 && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-destructive"
                style={{ top: ((nowMinute - firstHour * 60) / 60) * HOUR_PX }}
              />
            )}
            {layoutDay(byDay.get(d)!).map(({ lesson: l, lane, lanes }) => {
              const tone = lessonTone(l);
              return (
                <Link
                  key={l.lessonId}
                  href={`/ders/${l.lessonId}`}
                  title={`${minutesToTime(l.startMinute)} ${lessonTitle(l)}`}
                  className={cn(
                    "absolute overflow-hidden rounded-md border px-1.5 py-1 text-[11px] leading-tight transition-colors",
                    TONE_CLASSES[tone],
                  )}
                  style={{
                    top: ((l.startMinute - firstHour * 60) / 60) * HOUR_PX + 1,
                    height: Math.max((l.durationMinutes / 60) * HOUR_PX - 2, 20),
                    left: `calc(${(lane / lanes) * 100}% + 2px)`,
                    width: `calc(${100 / lanes}% - 4px)`,
                  }}
                >
                  <span className="font-semibold tabular-nums">{minutesToTime(l.startMinute)}</span>{" "}
                  <span className="font-medium">{lessonTitle(l)}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
