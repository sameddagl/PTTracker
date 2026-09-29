"use client";

import { useState, useTransition } from "react";
import { CalendarCheck, CalendarClock, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <h2 id="booking-heading" className="text-sm font-medium text-muted-foreground">
        Randevu al
      </h2>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {credits} ders için randevu alabilirsin · {lessonMinutes} dk
          </p>
          {days.length === 0 ? (
            <p className="text-sm text-muted-foreground">Önümüzdeki günlerde boş saat yok.</p>
          ) : (
            <>
              <ol className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Günler">
                {days.map((d) => (
                  <li key={d.date}>
                    <button
                      type="button"
                      onClick={() => {
                        setDay(d.date);
                        setPicked(null);
                      }}
                      aria-pressed={d.date === day}
                      aria-label={`${dayLong(d.date)}, ${d.minutes.length} boş saat`}
                      className={cn(
                        "flex w-14 flex-col items-center rounded-xl border py-2 text-xs transition-colors",
                        d.date === day ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                    >
                      <span className={d.date === day ? "" : "text-muted-foreground"}>{WEEKDAY_LABELS[isoWeekday(d.date) - 1]}</span>
                      <span className="text-lg font-semibold tabular-nums">{dayOfMonth(d.date)}</span>
                      <span className={d.date === day ? "" : "text-muted-foreground"}>{monthShort(d.date)}</span>
                    </button>
                  </li>
                ))}
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
                        "h-11 rounded-lg border text-sm font-medium tabular-nums transition-colors",
                        picked === m ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted",
                      )}
                    >
                      {toHHMM(m)}
                    </button>
                  ))}
                </div>
              )}

              {picked !== null && (
                <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3">
                  <p className="flex items-center gap-2 text-sm">
                    <CalendarCheck className="size-4 text-primary" aria-hidden />
                    <span>
                      <span className="font-medium">{dayLong(day)}</span> · {toHHMM(picked)}–{toHHMM(picked + lessonMinutes)}
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" onClick={book} disabled={pending}>
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
        </CardContent>
      </Card>
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
  lessons: { attendeeId: string; startsAt: Date; lateIfCancelledNow: boolean }[];
  timezone: string;
  lateCancelHours: number;
}) {
  const [pending, startTransition] = useTransition();

  function cancel(l: (typeof lessons)[number]) {
    const when = `${formatLongDate(l.startsAt, timezone)} ${formatTime(l.startsAt, timezone)}`;
    const question = l.lateIfCancelledNow
      ? `Derse ${lateCancelHours} saatten az kaldı. İptal edersen bu ders paketinden düşer (telafi hakkın varsa o kullanılır). ${when} dersini iptal etmek istiyor musun?`
      : `${when} dersini iptal etmek istiyor musun?`;
    if (!window.confirm(question)) return;
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
      <h2 id="upcoming-heading" className="mb-3 text-sm font-medium text-muted-foreground">
        Sıradaki derslerin
      </h2>
      {lessons.length === 0 ? (
        <p className="text-sm text-muted-foreground">Planlanmış ders yok.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lessons.map((l) => (
            <li key={l.attendeeId} className="flex items-center gap-3 rounded-lg border py-2 pr-2 pl-4">
              <CalendarClock className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="flex-1 text-sm capitalize">{formatLongDate(l.startsAt, timezone)}</span>
              <span className="text-sm tabular-nums">{formatTime(l.startsAt, timezone)}</span>
              <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => cancel(l)} aria-label="Dersi iptal et">
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
