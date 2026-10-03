"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, CalendarPlus, ChevronLeft, ChevronRight, Repeat, UsersRound } from "lucide-react";
import { ActionTiles } from "@/components/action-tiles";
import { PendingLink } from "@/components/navigation-pending";
import { Button } from "@/components/ui/button";
import type { CalendarLesson } from "@/db/lessons";
import { WEEKDAY_LABELS, dayLong, dayOfMonth } from "@/lib/dates";
import { SESSION_TYPE_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TONE_BARS, TONE_CLASSES, TONE_LABELS, layoutDay, lessonTitle, lessonTone, minutesToTime, takenPlaces } from "./lesson-summary";

const HOUR_PX = 56;

// The week on screen. Picking a day (phones) or an instructor only changes
// what is shown from the week already loaded, so it is instant; the URL is
// kept in step so a refresh or a link comes back to the same view. Changing
// week loads a new week from the server (PendingLink shows it's loading).

export type CalendarTeamMember = { id: string; label: string; color: string };

export function CalendarView({
  lessons,
  days,
  today,
  monday,
  rangeLabel,
  prevWeek,
  nextWeek,
  initialDay,
  initialFilter,
  team,
  canPlan,
  isOwner,
  nowMinute,
}: {
  lessons: CalendarLesson[];
  days: string[];
  today: string;
  monday: string;
  rangeLabel: string;
  prevWeek: string;
  nextWeek: string;
  initialDay: string;
  /** "hepsi" or a member id. */
  initialFilter: string;
  /** Studios: the instructor chips (empty: no filter to show). */
  team: CalendarTeamMember[];
  canPlan: boolean;
  isOwner: boolean;
  nowMinute: number;
}) {
  const [selected, setSelected] = useState(initialDay);
  const [filter, setFilter] = useState(initialFilter);
  const colors: Record<string, string> | null = team.length > 0 ? Object.fromEntries(team.map((m) => [m.id, m.color])) : null;
  const shown = filter === "hepsi" ? lessons : lessons.filter((l) => l.instructorId === filter);
  const byDay = new Map(days.map((d) => [d, shown.filter((l) => l.localDate === d)]));

  const q = (f: string) => (f === "hepsi" && isOwner ? "" : `&egitmen=${f}`);
  const url = (day: string, f: string) => `/takvim?hafta=${monday}&gun=${day}${q(f)}`;
  // Keep the address in step without asking the server again.
  const show = (day: string, f: string) => {
    setSelected(day);
    setFilter(f);
    window.history.replaceState(null, "", url(day, f));
  };
  const back = encodeURIComponent(url(selected, filter));

  return (
    <>
      <ActionTiles
        className="mb-6"
        items={[
          ...(canPlan ? [{ href: `/ders/yeni?tarih=${selected}&next=${back}`, icon: <CalendarPlus />, title: "Ders planla", primary: true }] : []),
          ...(isOwner
            ? [
                { href: "/takvim/grup", icon: <UsersRound />, title: "Grup dersleri" },
                { href: "/ayarlar/musaitlik", icon: <CalendarClock />, title: "Müsaitlik ve randevu" },
              ]
            : []),
        ]}
      />

      {team.length > 0 && (
        <nav aria-label="Eğitmen" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {[{ id: "hepsi", label: "Hepsi", color: null as string | null }, ...team].map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => show(selected, o.id)}
              aria-pressed={filter === o.id}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors md:min-h-9",
                filter === o.id ? "bg-foreground text-background" : "bg-card text-muted-foreground shadow-card hover:text-foreground",
              )}
            >
              {o.color && <span className="size-2.5 rounded-full" style={{ background: o.color }} aria-hidden />}
              {o.label}
            </button>
          ))}
        </nav>
      )}

      <nav aria-label="Hafta" className="mb-4 flex items-center gap-2">
        <Button asChild variant="outline" size="icon" aria-label="Önceki hafta">
          <PendingLink href={`/takvim?hafta=${prevWeek}${q(filter)}`} scroll={false}>
            <ChevronLeft />
          </PendingLink>
        </Button>
        <span className="min-w-0 flex-1 text-center text-sm font-medium tabular-nums">{rangeLabel}</span>
        <Button asChild variant="outline" size="icon" aria-label="Sonraki hafta">
          <PendingLink href={`/takvim?hafta=${nextWeek}${q(filter)}`} scroll={false}>
            <ChevronRight />
          </PendingLink>
        </Button>
        {!days.includes(today) && (
          <Button asChild variant="ghost" size="sm">
            <PendingLink href={`/takvim?${q(filter).slice(1)}`} scroll={false}>
              Bugün
            </PendingLink>
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
                <button
                  type="button"
                  onClick={() => show(d, filter)}
                  aria-current={d === selected ? "date" : undefined}
                  aria-label={`${dayLong(d)}, ${count} ders`}
                  className={cn(
                    "flex w-full flex-col items-center gap-1 rounded-2xl py-2 text-xs transition-colors",
                    d === selected ? "bg-primary text-primary-foreground shadow-card" : "hover:bg-card",
                    d === today && d !== selected && "text-primary",
                  )}
                >
                  <span className={d === selected ? "" : "text-muted-foreground"}>{WEEKDAY_LABELS[i]}</span>
                  <span className="text-base font-semibold tabular-nums">{dayOfMonth(d)}</span>
                  <span
                    className={cn("size-1.5 rounded-full", count === 0 ? "bg-transparent" : d === selected ? "bg-lime" : "bg-foreground")}
                    aria-hidden
                  />
                </button>
              </li>
            );
          })}
        </ol>

        <h2 className="mb-3 text-sm font-medium text-muted-foreground">{dayLong(selected)}</h2>
        <DayAgenda
          lessons={byDay.get(selected) ?? []}
          weekEmpty={shown.length === 0}
          addHref={canPlan ? `/ders/yeni?tarih=${selected}&next=${back}` : null}
          colors={colors}
        />
      </div>

      {/* Tablets and up: week grid */}
      <WeekGrid days={days} byDay={byDay} today={today} nowMinute={nowMinute} back={canPlan ? back : null} colors={colors} />
    </>
  );
}

/** Instructor colours in a studio (null for a trainer working alone). */
type Colors = Record<string, string> | null;

function LessonCard({ lesson: l, colors }: { lesson: CalendarLesson; colors: Colors }) {
  const tone = lessonTone(l);
  return (
    <Link
      href={`/ders/${l.lessonId}`}
      className={cn(
        "relative flex items-center gap-4 overflow-hidden surface py-3.5 pr-4 pl-5 transition-colors hover:bg-muted/50",
        tone === "cancelled" && "text-muted-foreground line-through",
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-3 left-0 w-1 rounded-r-full", TONE_BARS[tone])} />
      <div className="w-12 shrink-0">
        <div className="font-semibold tabular-nums">{minutesToTime(l.startMinute)}</div>
        <div className="text-xs text-muted-foreground tabular-nums">{minutesToTime(l.startMinute + l.durationMinutes)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate font-medium">
          {colors && l.instructorId && <span className="size-2.5 shrink-0 rounded-full" style={{ background: colors[l.instructorId] }} aria-hidden />}
          {l.groupClassId ? (l.title ?? "Grup dersi") : lessonTitle(l)}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {SESSION_TYPE_LABELS[l.sessionType]}
          {l.groupClassId && (
            <span className="tabular-nums">
              · {takenPlaces(l)}/{l.capacity} dolu
            </span>
          )}{" "}
          · {TONE_LABELS[tone]}
          {l.bookedByClient && " · Randevu"}
          {(l.seriesId || l.groupClassId) && <Repeat className="size-3" aria-label="Tekrarlayan" />}
        </p>
      </div>
    </Link>
  );
}

function DayAgenda({ lessons, addHref, weekEmpty, colors }: { lessons: CalendarLesson[]; addHref: string | null; weekEmpty: boolean; colors: Colors }) {
  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-8 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          {weekEmpty
            ? "Bu hafta ders yok. Her hafta tekrar eden bir ders ya da grup dersi planlarsan takvim kendiliğinden dolar."
            : "Bu gün ders yok."}
        </p>
        {addHref && (
          <Button asChild variant={weekEmpty ? "default" : "outline"} size="sm">
            <Link href={addHref}>
              <CalendarPlus />
              Ders planla
            </Link>
          </Button>
        )}
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {lessons.map((l) => (
        <li key={l.lessonId}>
          <LessonCard lesson={l} colors={colors} />
        </li>
      ))}
    </ul>
  );
}

function WeekGrid({
  days,
  byDay,
  today,
  back,
  colors,
  nowMinute,
}: {
  days: string[];
  byDay: Map<string, CalendarLesson[]>;
  today: string;
  /** Minute of the day now in the trainer's timezone (from the server, so it renders the same on both sides). */
  nowMinute: number;
  /** Where "Ders planla" returns to; null when the member can't plan lessons (the grid isn't clickable). */
  back: string | null;
  colors: Colors;
}) {
  const all = [...byDay.values()].flat();
  // 07:00–21:00 by default, stretched to fit any earlier or later lesson.
  const firstHour = Math.min(7, ...all.map((l) => Math.floor(l.startMinute / 60)));
  const lastHour = Math.max(21, ...all.map((l) => Math.ceil((l.startMinute + l.durationMinutes) / 60)));
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);

  return (
    <div data-wide className="hidden overflow-hidden surface md:block">
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
            <div key={h} style={{ height: HOUR_PX }} className="pr-2 text-right text-xs text-muted-foreground tabular-nums">
              <span className="relative -top-2">{h > firstHour ? `${String(h).padStart(2, "0")}:00` : ""}</span>
            </div>
          ))}
        </div>
        {days.map((d) => (
          <div key={d} className={cn("relative border-l", d === today && "bg-primary/[0.03]")}>
            {hours.map((h) =>
              back ? (
                <Link
                  key={h}
                  href={`/ders/yeni?tarih=${d}&saat=${String(h).padStart(2, "0")}:00&next=${back}`}
                  aria-label={`${dayLong(d)} ${String(h).padStart(2, "0")}:00 için ders planla`}
                  style={{ height: HOUR_PX }}
                  className="block border-b border-dashed border-border/60 transition-colors hover:bg-muted/40"
                />
              ) : (
                <div key={h} style={{ height: HOUR_PX }} className="border-b border-dashed border-border/60" />
              ),
            )}
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
                    "absolute overflow-hidden rounded-lg border px-2 py-1 text-xs leading-tight transition-colors",
                    TONE_CLASSES[tone],
                  )}
                  style={{
                    top: ((l.startMinute - firstHour * 60) / 60) * HOUR_PX + 1,
                    height: Math.max((l.durationMinutes / 60) * HOUR_PX - 2, 20),
                    left: `calc(${(lane / lanes) * 100}% + 2px)`,
                    width: `calc(${100 / lanes}% - 4px)`,
                    ...(colors && l.instructorId ? { borderLeft: `3px solid ${colors[l.instructorId]}` } : {}),
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
