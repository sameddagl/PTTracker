"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Program } from "@/db/programs";
import { NUTRITION_DISCLAIMER, NUTRITION_TARGETS, itemSummary } from "@/lib/programs";
import { cn } from "@/lib/utils";
import { setCheckinAction } from "./program-actions";

const fmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "UTC" });
const dayLabel = (iso: string) => fmt.format(new Date(`${iso}T00:00:00Z`));

/** Monday of the week containing `iso`. */
function weekStart(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/** The client's workout program: one day at a time, with "yaptım" for today. */
export function ProgramTab({
  token,
  program,
  checkins,
  today,
  trainerName,
}: {
  token: string;
  program: Program;
  checkins: { dayId: string; doneOn: string }[];
  today: string;
  trainerName: string;
}) {
  // Start on the day after the last one done, so a rotation (A → B → C) moves on by itself.
  const lastDone = checkins[0]?.dayId;
  const lastIdx = program.days.findIndex((d) => d.id === lastDone);
  const doneToday = checkins.find((c) => c.doneOn === today)?.dayId;
  const initial = doneToday ?? program.days[lastIdx >= 0 ? (lastIdx + 1) % program.days.length : 0]?.id;
  const [selected, setSelected] = useState(initial);
  const [pending, start] = useTransition();
  const [marks, setMark] = useOptimistic(checkins, (list, m: { dayId: string; done: boolean }) =>
    m.done ? [{ dayId: m.dayId, doneOn: today }, ...list] : list.filter((c) => !(c.dayId === m.dayId && c.doneOn === today)),
  );
  const day = program.days.find((d) => d.id === selected) ?? program.days[0];
  const isDone = marks.some((c) => c.dayId === day?.id && c.doneOn === today);
  const thisWeek = marks.filter((c) => c.doneOn >= weekStart(today)).length;

  function toggle() {
    if (!day) return;
    const done = !isDone;
    start(async () => {
      setMark({ dayId: day.id, done });
      const res = await setCheckinAction(token, day.id, done);
      if (!res.ok) toast.error("Kaydedilemedi, tekrar dene.");
      else if (done) toast.success("Harika, eğitmenin görecek");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <p className="eyebrow">Programın</p>
        <h2 className="text-2xl leading-tight font-semibold">{program.name}</h2>
        {program.note && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{program.note}</p>}
        <dl className="mt-1 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-card px-3 py-2.5 shadow-card">
            <dt className="text-xs text-muted-foreground">Bu hafta</dt>
            <dd className="text-lg font-semibold tabular-nums">{thisWeek} antrenman</dd>
          </div>
          <div className="rounded-xl bg-card px-3 py-2.5 shadow-card">
            <dt className="text-xs text-muted-foreground">Son 4 hafta</dt>
            <dd className="text-lg font-semibold tabular-nums">{marks.length} antrenman</dd>
          </div>
        </dl>
      </section>

      {program.days.length > 1 && (
        <div role="tablist" aria-label="Günler" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {program.days.map((d) => {
            const on = d.id === day?.id;
            const doneNow = marks.some((c) => c.dayId === d.id && c.doneOn === today);
            return (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setSelected(d.id)}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors",
                  on ? "bg-foreground text-background" : "bg-card text-muted-foreground shadow-card hover:text-foreground",
                )}
              >
                {doneNow && <Check className="size-4" aria-label="Bugün yapıldı" />}
                {d.title}
              </button>
            );
          })}
        </div>
      )}

      {day && (
        <ol className="flex flex-col gap-3" aria-label={day.title}>
          {day.items.map((i, n) => (
            <li key={i.id} className="flex gap-3 surface p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-semibold text-lime-foreground tabular-nums" aria-hidden>
                {n + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{i.name}</p>
                {itemSummary(i) && <p className="text-sm text-muted-foreground tabular-nums">{itemSummary(i)}</p>}
                {i.note && <p className="mt-1 text-sm">{i.note}</p>}
                {i.videoUrl && (
                  <a
                    href={i.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    <PlayCircle className="size-4" aria-hidden />
                    Videoyu izle
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {day && (
        <Button type="button" size="lg" variant={isDone ? "outline" : "default"} onClick={toggle} disabled={pending} className="w-full">
          <Check />
          {isDone ? `${day.title} bugün yapıldı · geri al` : "Bugünkü antrenmanı yaptım"}
        </Button>
      )}

      {marks.length > 0 && (
        <section aria-labelledby="done-heading">
          <h2 id="done-heading" className="mb-2 text-sm font-semibold text-muted-foreground">
            Son antrenmanların
          </h2>
          <ul className="divide-y overflow-hidden surface text-sm">
            {marks.slice(0, 8).map((c) => (
              <li key={`${c.dayId}-${c.doneOn}`} className="flex items-center justify-between px-4 py-2.5">
                <span>{dayLabel(c.doneOn)}</span>
                <span className="text-muted-foreground">{program.days.find((d) => d.id === c.dayId)?.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-center text-xs text-muted-foreground">Bir hareket ağrı yaparsa dur ve {trainerName} ile konuş.</p>
    </div>
  );
}

/** The client's nutrition plan: targets, then meal by meal. */
export function NutritionTab({ program }: { program: Program }) {
  const targets = NUTRITION_TARGETS.filter((t) => program.targets[t.key]);
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <p className="eyebrow">Beslenme planın</p>
        <h2 className="text-2xl leading-tight font-semibold">{program.name}</h2>
        {program.note && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{program.note}</p>}
      </section>
      {targets.length > 0 && (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {targets.map((t) => (
            <div key={t.key} className="rounded-xl bg-card px-3 py-2.5 shadow-card">
              <dt className="text-xs text-muted-foreground">Günlük {t.label.toLocaleLowerCase("tr")}</dt>
              <dd className="text-lg font-semibold">{program.targets[t.key]}</dd>
            </div>
          ))}
        </dl>
      )}
      <ol className="flex flex-col gap-3">
        {program.days.map((d) => (
          <li key={d.id} className="surface p-4">
            <h3 className="mb-2 font-semibold">{d.title}</h3>
            <ul className="flex flex-col gap-1.5 text-sm">
              {d.items.map((i) => (
                <li key={i.id} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-lime" aria-hidden />
                  <span className="whitespace-pre-wrap">{i.name}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="rounded-2xl bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">{NUTRITION_DISCLAIMER}</p>
    </div>
  );
}
