"use client";

import { useState, useTransition } from "react";
import { CalendarClock, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatLongDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { cancelBookingAction } from "./booking-actions";

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
