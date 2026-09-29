"use client";

import { useState, useTransition } from "react";
import { CalendarCheck, CalendarClock, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WEEKDAY_LABELS, dayLong, dayOfMonth, isoWeekday } from "@/lib/dates";
import { formatLongDate, formatTime } from "@/lib/format";
import type { DaySlots } from "@/lib/slots";
import { toHHMM } from "@/lib/slots";
import { cn } from "@/lib/utils";
import { bookSlotAction, cancelBookingAction } from "./booking-actions";

const monthShort = (iso: string) =>
  new Intl.DateTimeFormat("tr-TR", { month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export function BookingPanel({
  token,
  days,
  lessonMinutes,
  credits,
}: {
  token: string;
  days: DaySlots[];
  lessonMinutes: number;
  /** Lessons the client can still book across their private packages. */
  credits: number;
}) {
  const [day, setDay] = useState(days[0]?.date ?? "");
  const [picked, setPicked] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const current = days.find((d) => d.date === day);

  function book() {
    if (picked === null) return;
    startTransition(async () => {
      const res = await bookSlotAction(token, day, picked);
      if (res.ok) {
        toast.success(`${dayLong(day)} ${toHHMM(picked)} randevun alındı`);
        setPicked(null);
      } else toast.error(res.error);
    });
  }

  return (
    <section aria-labelledby="booking-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="booking-heading" className="text-base font-semibold">
          Randevu al
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">{lessonMinutes} dk ders</span>
      </div>
      <div className="flex flex-col gap-5 surface p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="lime" className="tabular-nums">
            {credits} ders
          </Badge>
          için randevu alabilirsin
        </p>
        {days.length === 0 ? (
          <p className="rounded-xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">Önümüzdeki günlerde boş saat yok.</p>
        ) : (
          <>
            <ol className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5" aria-label="Günler">
              {days.map((d) => {
                const on = d.date === day;
                return (
                  <li key={d.date} className="snap-start">
                    <button
                      type="button"
                      onClick={() => {
                        setDay(d.date);
                        setPicked(null);
                      }}
                      aria-pressed={on}
                      aria-label={`${dayLong(d.date)}, ${d.minutes.length} boş saat`}
                      className={cn(
                        "flex w-15 flex-col items-center gap-0.5 rounded-2xl border py-2.5 text-xs transition-colors",
                        on ? "border-transparent bg-primary text-primary-foreground shadow-float" : "bg-card hover:bg-muted",
                      )}
                    >
                      <span className={on ? "opacity-80" : "text-muted-foreground"}>{WEEKDAY_LABELS[isoWeekday(d.date) - 1]}</span>
                      <span className="text-xl leading-tight font-semibold tabular-nums">{dayOfMonth(d.date)}</span>
                      <span className={on ? "opacity-80" : "text-muted-foreground"}>{monthShort(d.date)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {current && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label={`${dayLong(day)} boş saatler`}>
                {current.minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPicked(m)}
                    aria-pressed={picked === m}
                    className={cn(
                      "h-11 rounded-full border text-sm font-medium tabular-nums transition-colors",
                      picked === m ? "border-transparent bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                    )}
                  >
                    {toHHMM(m)}
                  </button>
                ))}
              </div>
            )}

            {picked !== null && (
              <div className="flex flex-col gap-3 rounded-xl bg-muted/60 p-3">
                <p className="flex items-center gap-2 text-sm">
                  <CalendarCheck className="size-4 shrink-0" aria-hidden />
                  <span>
                    <span className="font-semibold">{dayLong(day)}</span> · {toHHMM(picked)}–{toHHMM(picked + lessonMinutes)}
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button type="button" onClick={book} loading={pending} className="flex-1 sm:flex-none">
                    {pending ? "Alınıyor…" : "Randevuyu onayla"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setPicked(null)}>
                    Vazgeç
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export function UpcomingLessons({
  token,
  lessons,
  timezone,
  lateCancelHours,
}: {
  token: string;
  lessons: { attendeeId: string; startsAt: Date; title: string | null; lateIfCancelledNow: boolean }[];
  timezone: string;
  lateCancelHours: number;
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function cancel(l: (typeof lessons)[number]) {
    const when = `${formatLongDate(l.startsAt, timezone)} ${formatTime(l.startsAt, timezone)}`;
    const question = l.lateIfCancelledNow
      ? `Derse ${lateCancelHours} saatten az kaldı. İptal edersen bu ders paketinden düşer (telafi hakkın varsa o kullanılır). ${when} dersini iptal etmek istiyor musun?`
      : `${when} dersini iptal etmek istiyor musun?`;
    if (!window.confirm(question)) return;
    setBusy(l.attendeeId);
    startTransition(async () => {
      const res = await cancelBookingAction(token, l.attendeeId, l.lateIfCancelledNow);
      if (res.ok) {
        toast(res.late ? (res.makeupUsed ? "İptal edildi; telafi hakkın kullanıldı." : "İptal edildi; ders paketinden düştü.") : "Ders iptal edildi");
      } else if (res.needsConfirm) {
        // The notice window started while the page was open; ask again with the right warning.
        toast.error("Derse az kaldığı için iptal geç iptal sayılır. Tekrar dene.");
      } else toast.error(res.error);
    });
  }

  return (
    <section aria-labelledby="upcoming-heading">
      <h2 id="upcoming-heading" className="mb-3 text-base font-semibold">
        Sıradaki derslerin
      </h2>
      {lessons.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
          Planlanmış ders yok.
        </p>
      ) : (
        <ul className="divide-y overflow-hidden surface">
          {lessons.map((l, i) => (
            <li key={l.attendeeId} className="flex items-center gap-3 py-3 pr-2 pl-4">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  i === 0 ? "bg-lime text-lime-foreground" : "bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                <CalendarClock className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block truncate font-medium capitalize">{formatLongDate(l.startsAt, timezone)}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  <span className="tabular-nums">{formatTime(l.startsAt, timezone)}</span>
                  {l.title && <> · {l.title}</>}
                </span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                loading={pending && busy === l.attendeeId}
                onClick={() => cancel(l)}
                aria-label="Dersi iptal et"
                className="text-muted-foreground"
              >
                <X />
                <span className="max-sm:sr-only">İptal</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
