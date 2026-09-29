"use client";

import { useState, useTransition } from "react";
import { Check, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <h2 id="groups-heading" className="text-sm font-medium text-muted-foreground">
        Grup dersleri
      </h2>
      <Card>
        <CardContent className="flex flex-col gap-4">
          {fixed.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm">
              {fixed.map((f) => (
                <li key={f.title} className="flex items-center gap-2">
                  <UsersRound className="size-4 text-primary" aria-hidden />
                  <span>
                    Sabit yerin: <span className="font-medium">{f.title}</span> · {weekdayList(f.weekdays)} {f.startTime}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-muted-foreground">
            {credits > 0 ? `Grup paketinde ${credits} ders için yer ayırabilirsin.` : "Grup paketin olduğunda boş derslere katılabilirsin."}
          </p>
          <ul className="flex flex-col gap-2">
            {slots.slice(0, 10).map((s) => {
              const left = Math.max(s.capacity - s.taken, 0);
              return (
                <li key={s.lessonId} className="flex items-center gap-3 rounded-lg border py-2 pr-2 pl-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="capitalize">{formatLongDate(s.startsAt, timezone)}</span> · {formatTime(s.startsAt, timezone)} ·{" "}
                      {left > 0 ? `${left} yer kaldı` : "Dolu"}
                    </p>
                  </div>
                  {s.joined ? (
                    <span className="flex items-center gap-1 px-2 text-sm font-medium text-success-strong">
                      <Check className="size-4" aria-hidden />
                      Yerin var
                    </span>
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
        </CardContent>
      </Card>
    </section>
  );
}
