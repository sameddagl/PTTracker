"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { formatLongDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { cancelBookingAction, confirmAttendanceAction } from "./booking-actions";

type Lesson = { attendeeId: string; startsAt: Date; title: string | null; lateIfCancelledNow: boolean; confirmed: boolean };

/** "Geliyorum" and "Gelemiyorum / İptal et" for a booked lesson, shared by the list and the prompt at the top. */
function useLessonAnswers(token: string, timezone: string, lateCancelHours: number) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const { confirm: confirmDialog, dialog } = useConfirm();

  function confirm(l: Lesson) {
    setBusy(`ok:${l.attendeeId}`);
    startTransition(async () => {
      const res = await confirmAttendanceAction(token, l.attendeeId);
      if (res.ok) toast.success("Eğitmenine haber verdik");
      else toast.error(res.error);
    });
  }

  async function cancel(l: Lesson) {
    const when = `${formatLongDate(l.startsAt, timezone)} ${formatTime(l.startsAt, timezone)}`;
    const ok = await confirmDialog({
      title: `${when} dersini iptal etmek istiyor musun?`,
      body: l.lateIfCancelledNow
        ? `Derse ${lateCancelHours} saatten az kaldı. Şimdi iptal edersen telafi hakkın varsa ondan, yoksa paketinden bir ders düşer.`
        : undefined,
      confirmLabel: "Dersi iptal et",
      cancelLabel: "Vazgeç",
      destructive: l.lateIfCancelledNow,
    });
    if (!ok) return;
    setBusy(l.attendeeId);
    startTransition(async () => {
      const res = await cancelBookingAction(token, l.attendeeId, l.lateIfCancelledNow);
      if (res.ok) {
        toast(res.late ? (res.makeupUsed ? "Ders iptal edildi, telafi hakkından düştü." : "Ders iptal edildi, paketinden düştü.") : "Ders iptal edildi");
      } else if (res.needsConfirm) {
        // The notice window started while the page was open; ask again with the right warning.
        toast.error("Derse az kaldı, bu iptal geç iptal sayılır. Emin misin? Tekrar dokun.");
      } else toast.error(res.error);
    });
  }

  return { confirm, cancel, pending, busy, dialog };
}

/** The reminder's question, at the top of the page: the next lesson the client hasn't answered for yet. */
export function NextLessonPrompt({
  token,
  lesson: l,
  when,
  timezone,
  lateCancelHours,
}: {
  token: string;
  lesson: Lesson;
  when: string;
  timezone: string;
  lateCancelHours: number;
}) {
  const { confirm, cancel, pending, busy, dialog } = useLessonAnswers(token, timezone, lateCancelHours);
  return (
    <section id="yaklasan" aria-labelledby="next-lesson-heading" className="flex scroll-mt-6 flex-col gap-4 rounded-2xl bg-lime p-5 text-lime-foreground">
      {dialog}
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime-foreground text-lime" aria-hidden>
          <CalendarClock className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="next-lesson-heading" className="text-lg leading-snug font-semibold">
            {when} dersin var
          </h2>
          <p className="text-sm opacity-80">{l.title ? `${l.title} · ` : ""}Geliyor musun?</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          disabled={pending}
          loading={pending && busy === `ok:${l.attendeeId}`}
          onClick={() => confirm(l)}
          className="bg-lime-foreground text-lime hover:bg-lime-foreground/85"
        >
          <Check />
          Geliyorum
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          loading={pending && busy === l.attendeeId}
          onClick={() => cancel(l)}
          className="border-lime-foreground/25 bg-transparent text-lime-foreground hover:bg-lime-foreground/10"
        >
          <X />
          Gelemiyorum
        </Button>
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
  lessons: Lesson[];
  timezone: string;
  lateCancelHours: number;
}) {
  const { confirm, cancel, pending, busy, dialog } = useLessonAnswers(token, timezone, lateCancelHours);

  return (
    <section id="dersler" aria-labelledby="upcoming-heading" className="scroll-mt-6">
      {dialog}
      <h2 id="upcoming-heading" className="mb-3 text-base font-semibold">
        Sıradaki derslerin
      </h2>
      {lessons.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
          Yaklaşan dersin yok.
        </p>
      ) : (
        <ul className="divide-y overflow-hidden surface">
          {lessons.map((l, i) => (
            <li key={l.attendeeId} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
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
              </div>
              <div className="flex items-center gap-2 pl-13 sm:pl-0">
                {l.confirmed ? (
                  <Badge variant="success" className="h-8 px-3">
                    <Check aria-hidden />
                    Geliyorsun
                  </Badge>
                ) : (
                  <Button type="button" size="sm" disabled={pending} loading={pending && busy === `ok:${l.attendeeId}`} onClick={() => confirm(l)}>
                    Geliyorum
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  loading={pending && busy === l.attendeeId}
                  onClick={() => cancel(l)}
                  className="text-muted-foreground"
                >
                  <X />
                  {l.confirmed ? "İptal et" : "Gelemiyorum"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
