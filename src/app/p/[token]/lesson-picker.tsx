"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarCheck, Check, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WEEKDAY_LABELS, dayLong, dayOfMonth, isoWeekday, weekdayList } from "@/lib/dates";
import type { DaySlots } from "@/lib/slots";
import { toHHMM } from "@/lib/slots";
import { cn } from "@/lib/utils";
import { bookSlotAction, joinGroupAction } from "./booking-actions";

const monthShort = (iso: string) =>
  new Intl.DateTimeFormat("tr-TR", { month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export type GroupSlotView = {
  lessonId: string;
  title: string;
  /** Local date and times in the trainer's timezone, formatted on the server. */
  date: string;
  start: string;
  end: string;
  capacity: number;
  taken: number;
  joined: boolean;
  canJoin: boolean;
};

/**
 * "Ders al": one day strip for everything the client can book. A picked day
 * lists its group classes (join) and free private slots (book) together.
 */
export function LessonPicker({
  token,
  priv,
  group,
}: {
  token: string;
  /** Private booking, when open and the client has private credits. */
  priv: { days: DaySlots[]; lessonMinutes: number; credits: number } | null;
  /** Group classes, when the client has group credits, a fixed place or a booking. */
  group: { credits: number; fixed: { title: string; weekdays: number[]; startTime: string }[]; slots: GroupSlotView[] } | null;
}) {
  const days = useMemo(() => {
    const dates = new Set([...(priv?.days.map((d) => d.date) ?? []), ...(group?.slots.map((s) => s.date) ?? [])]);
    return [...dates].sort();
  }, [priv, group]);
  const [day, setDay] = useState(days[0] ?? "");
  const [picked, setPicked] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const privDay = priv?.days.find((d) => d.date === day);
  const groupDay = group?.slots.filter((s) => s.date === day) ?? [];

  function book() {
    if (picked === null) return;
    setBusy("private");
    start(async () => {
      const res = await bookSlotAction(token, day, picked);
      if (res.ok) {
        toast.success(`${dayLong(day)} ${toHHMM(picked)} randevun alındı`);
        setPicked(null);
      } else toast.error(res.error);
    });
  }

  function join(s: GroupSlotView) {
    setBusy(s.lessonId);
    start(async () => {
      const res = await joinGroupAction(token, s.lessonId);
      if (res.ok) toast.success(`${dayLong(s.date)} ${s.start} ${s.title} dersine yerin ayrıldı`);
      else toast.error(res.error);
    });
  }

  return (
    <section aria-labelledby="picker-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="picker-heading" className="text-base font-semibold">
          Ders al
        </h2>
        <span className="flex flex-wrap gap-1.5">
          {priv && (
            <Badge variant="secondary" className="tabular-nums">
              Özel: {priv.credits} ders
            </Badge>
          )}
          {group && group.credits > 0 && (
            <Badge variant="lime" className="tabular-nums">
              Grup: {group.credits} ders
            </Badge>
          )}
        </span>
      </div>

      <div className="flex flex-col gap-5 surface p-4 sm:p-5">
        {group?.fixed.map((f) => (
          <p key={f.title} className="flex items-center gap-3 rounded-xl bg-lime px-3 py-2.5 text-sm text-lime-foreground">
            <UsersRound className="size-4 shrink-0" aria-hidden />
            <span className="min-w-0">
              Sabit yerin: <span className="font-semibold">{f.title}</span> · {weekdayList(f.weekdays)} {f.startTime}
            </span>
          </p>
        ))}

        {days.length === 0 ? (
          <p className="rounded-xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">Önümüzdeki günlerde uygun ders yok.</p>
        ) : (
          <>
            <ol className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5" aria-label="Günler">
              {days.map((d) => {
                const on = d === day;
                const hasGroup = group?.slots.some((s) => s.date === d);
                const hasPrivate = priv?.days.some((p) => p.date === d);
                return (
                  <li key={d} className="snap-start">
                    <button
                      type="button"
                      onClick={() => {
                        setDay(d);
                        setPicked(null);
                      }}
                      aria-pressed={on}
                      aria-label={`${dayLong(d)}${hasGroup ? ", grup dersi var" : ""}${hasPrivate ? ", özel ders saati var" : ""}`}
                      className={cn(
                        "flex w-15 flex-col items-center gap-0.5 rounded-2xl border py-2.5 text-xs transition-colors",
                        on ? "border-transparent bg-primary text-primary-foreground shadow-float" : "bg-card hover:bg-muted",
                      )}
                    >
                      <span className={on ? "opacity-80" : "text-muted-foreground"}>{WEEKDAY_LABELS[isoWeekday(d) - 1]}</span>
                      <span className="text-xl leading-tight font-semibold tabular-nums">{dayOfMonth(d)}</span>
                      <span className={on ? "opacity-80" : "text-muted-foreground"}>{monthShort(d)}</span>
                      <span className="mt-1 flex h-1.5 gap-1" aria-hidden>
                        {hasGroup && <span className="size-1.5 rounded-full bg-lime ring-1 ring-lime-foreground/20" />}
                        {hasPrivate && <span className={cn("size-1.5 rounded-full", on ? "bg-primary-foreground" : "bg-foreground")} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {priv && group && (
              <p className="-mt-2 flex gap-4 text-xs text-muted-foreground" aria-hidden>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-lime ring-1 ring-lime-foreground/20" />
                  Grup dersi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-foreground" />
                  Özel ders
                </span>
              </p>
            )}

            {groupDay.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Grup dersleri</p>
                <ul className="flex flex-col gap-2">
                  {groupDay.map((s) => {
                    const left = Math.max(s.capacity - s.taken, 0);
                    return (
                      <li key={s.lessonId} className="flex items-center gap-3 rounded-2xl border py-2.5 pr-2.5 pl-4">
                        <div className="w-12 shrink-0">
                          <p className="text-sm font-semibold tabular-nums">{s.start}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">{s.end}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{s.title}</p>
                          <p className={cn("text-xs", left > 0 ? "text-muted-foreground" : "text-destructive-strong")}>
                            {left > 0 ? `${left} yer kaldı` : "Dolu"}
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
            )}

            {privDay && priv && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">
                  Özel ders <span className="font-normal text-muted-foreground">· {priv.lessonMinutes} dk</span>
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label={`${dayLong(day)} boş özel ders saatleri`}>
                  {privDay.minutes.map((m) => (
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
                {picked !== null && (
                  <div className="mt-1 flex flex-col gap-3 rounded-xl bg-muted/60 p-3">
                    <p className="flex items-center gap-2 text-sm">
                      <CalendarCheck className="size-4 shrink-0" aria-hidden />
                      <span>
                        <span className="font-semibold">{dayLong(day)}</span> · {toHHMM(picked)}–{toHHMM(picked + priv.lessonMinutes)}
                      </span>
                    </p>
                    <div className="flex gap-2">
                      <Button type="button" onClick={book} loading={pending && busy === "private"} className="flex-1 sm:flex-none">
                        Randevuyu onayla
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setPicked(null)}>
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {groupDay.length === 0 && !privDay && (
              <p className="rounded-xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">Bu gün uygun ders yok.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
