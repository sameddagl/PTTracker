"use client";

import { useState, useTransition } from "react";
import { Check, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { weekdayList } from "@/lib/dates";
import { formatLongDate, formatTime } from "@/lib/format";
import { joinGroupAction } from "./booking-actions";

type Slot = { lessonId: string; title: string; startsAt: Date; capacity: number; taken: number; joined: boolean; canJoin: boolean };

export function GroupPanel({
  token,
  timezone,
  credits,
  fixed,
  slots,
}: {
  token: string;
  timezone: string;
  credits: number;
  fixed: { title: string; weekdays: number[]; startTime: string }[];
  slots: Slot[];
}) {
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function join(s: Slot) {
    setBusy(s.lessonId);
    start(async () => {
      const res = await joinGroupAction(token, s.lessonId);
      if (res.ok) toast.success(`${formatLongDate(s.startsAt, timezone)} ${formatTime(s.startsAt, timezone)} dersine yerin ayrıldı`);
      else toast.error(res.error);
    });
  }

  return (
    <section aria-labelledby="groups-heading" className="flex flex-col gap-3">
      <h2 id="groups-heading" className="text-base font-semibold">
        Grup dersleri
      </h2>
      <div className="flex flex-col gap-4 surface p-4 sm:p-5">
        {fixed.length > 0 && (
          <ul className="flex flex-col gap-2 text-sm">
            {fixed.map((f) => (
              <li key={f.title} className="flex items-center gap-3 rounded-xl bg-lime px-3 py-2.5 text-lime-foreground">
                <UsersRound className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  Sabit yerin: <span className="font-semibold">{f.title}</span> · {weekdayList(f.weekdays)} {f.startTime}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-muted-foreground">
          {credits > 0 ? `Grup paketinde ${credits} ders için yer ayırabilirsin.` : "Grup paketin olduğunda boş derslere katılabilirsin."}
        </p>
        <ul className="-mx-4 -mb-2 flex flex-col divide-y border-t sm:-mx-5 sm:-mb-3">
          {slots.slice(0, 10).map((s) => {
            const left = Math.max(s.capacity - s.taken, 0);
            return (
              <li key={s.lessonId} className="flex min-h-16 items-center gap-3 py-2.5 pr-3 pl-4 sm:pl-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="capitalize">{formatLongDate(s.startsAt, timezone)}</span> · {formatTime(s.startsAt, timezone)} ·{" "}
                    <span className={left > 0 ? "" : "text-destructive-strong"}>{left > 0 ? `${left} yer kaldı` : "Dolu"}</span>
                  </p>
                </div>
                {s.joined ? (
                  <Badge variant="success" className="h-8 px-3">
                    <Check aria-hidden />
                    Yerin var
                  </Badge>
                ) : (
                  s.canJoin && (
                    <Button type="button" size="sm" disabled={pending} loading={pending && busy === s.lessonId} onClick={() => join(s)}>
                      Katıl
                    </Button>
                  )
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
