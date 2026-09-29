"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, Repeat, Search } from "lucide-react";
import { Field, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WEEKDAY_LABELS, addDays, dayShort, isoWeekday, recurringDates } from "@/lib/dates";
import { SESSION_TYPE_LABELS } from "@/lib/format";
import { submitWithoutReset } from "@/lib/use-form-submit";
import { useScrollIntoView } from "@/lib/use-scroll-into-view";
import { cn } from "@/lib/utils";
import { createLessonAction, type LessonFormState } from "./actions";

type SessionType = keyof typeof SESSION_TYPE_LABELS;

const typeForCount = (n: number): SessionType => (n <= 1 ? "private" : n === 2 ? "duet" : n === 3 ? "trio" : "group");

const chip =
  "flex cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring";

export function LessonForm({
  clients,
  preselected,
  today,
  defaultDate,
  defaultTime,
  next,
}: {
  clients: { id: string; fullName: string }[];
  preselected: string[];
  today: string;
  defaultDate: string;
  defaultTime: string;
  next: string;
}) {
  const [state, action, pending] = useActionState<LessonFormState, FormData>(createLessonAction, {});
  const conflictRef = useScrollIntoView<HTMLDivElement>(state.conflicts);
  const e = state.errors ?? {};

  const [selected, setSelected] = useState<string[]>(preselected);
  // Follows the number of selected clients until the trainer picks a type by hand.
  const [typeOverride, setTypeOverride] = useState<SessionType | null>(null);
  const [date, setDate] = useState(defaultDate);
  const [status, setStatus] = useState<"scheduled" | "attended">(defaultDate < today ? "attended" : "scheduled");
  const [repeat, setRepeat] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>(() => [isoWeekday(defaultDate)]);
  const [weeks, setWeeks] = useState(4);
  const [query, setQuery] = useState("");

  const sessionType = typeOverride ?? typeForCount(selected.length);
  const isPast = date < today;

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return q ? clients.filter((c) => c.fullName.toLocaleLowerCase("tr").includes(q)) : clients;
  }, [clients, query]);

  const occurrences = repeat && date ? recurringDates(date, addDays(date, weeks * 7 - 1), weekdays) : [];

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleWeekday = (d: number) =>
    setWeekdays((w) => (w.includes(d) ? w.filter((x) => x !== d) : [...w, d].sort((a, b) => a - b)));

  function changeDate(value: string) {
    setDate(value);
    // A lesson in the past has almost always already happened.
    if (value < today && !repeat) setStatus("attended");
    if (value >= today && status === "attended") setStatus("scheduled");
    // Keep the repeat starting on the chosen day.
    if (value && weekdays.length <= 1) setWeekdays([isoWeekday(value)]);
  }

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="sessionType" value={sessionType} />
      {selected.map((id) => (
        <input key={id} type="hidden" name="clientIds" value={id} />
      ))}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">
          Danışan{selected.length > 0 && <span className="font-normal text-muted-foreground"> · {selected.length} seçili</span>}
        </legend>
        {clients.length > 6 && (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              placeholder="Danışan ara"
              aria-label="Danışan ara"
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              className="pl-8"
            />
          </div>
        )}
        <ul className="max-h-64 divide-y overflow-y-auto rounded-lg border">
          {visible.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                  className="size-4 accent-[var(--primary)]"
                />
                <span className="text-sm">{c.fullName}</span>
              </label>
            </li>
          ))}
          {visible.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted-foreground">Sonuç yok</li>}
        </ul>
        {e.clientIds && <p className="text-sm text-destructive">{e.clientIds}</p>}
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <Field id="date" label={repeat ? "Başlangıç" : "Tarih"} error={e.date}>
          <Input id="date" name="date" type="date" value={date} onChange={(ev) => changeDate(ev.target.value)} />
        </Field>
        <Field id="time" label="Saat" error={e.time}>
          <Input id="time" name="time" type="time" step={300} defaultValue={defaultTime} />
        </Field>
        <Field id="durationMinutes" label="Süre" error={e.durationMinutes}>
          <NativeSelect id="durationMinutes" name="durationMinutes" defaultValue="60">
            {[30, 45, 50, 55, 60, 75, 90].map((m) => (
              <option key={m} value={m}>
                {m} dk
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="sessionTypeSelect" label="Ders türü">
          <NativeSelect
            id="sessionTypeSelect"
            value={sessionType}
            onChange={(ev) => setTypeOverride(ev.target.value as SessionType)}
          >
            {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3 rounded-xl border p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="repeat"
            checked={repeat}
            onChange={(ev) => {
              setRepeat(ev.target.checked);
              if (ev.target.checked) setStatus("scheduled");
            }}
            className="size-4 accent-[var(--primary)]"
          />
          <Repeat className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">Her hafta tekrarla</span>
        </label>

        {repeat && (
          <>
            <div role="group" aria-label="Günler" className="grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((label, i) => (
                <label key={label} className={cn(chip, "h-10 text-xs")}>
                  <input
                    type="checkbox"
                    name="weekdays"
                    value={i + 1}
                    checked={weekdays.includes(i + 1)}
                    onChange={() => toggleWeekday(i + 1)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
            {e.weekdays && <p className="text-sm text-destructive">{e.weekdays}</p>}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Süre</span>
              <NativeSelect
                name="weeks"
                aria-label="Kaç hafta"
                value={weeks}
                onChange={(ev) => setWeeks(Number(ev.target.value))}
                className="w-32"
              >
                {[4, 8, 12, 26].map((w) => (
                  <option key={w} value={w}>
                    {w} hafta
                  </option>
                ))}
              </NativeSelect>
            </div>
            <p className="text-sm text-muted-foreground">
              {occurrences.length > 0
                ? `${occurrences.length} ders: ${dayShort(occurrences[0])} – ${dayShort(occurrences.at(-1)!)}`
                : "Seçilen günler bu aralığa denk gelmiyor."}
            </p>
          </>
        )}
      </fieldset>

      {!repeat && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Durum</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["scheduled", "Planlandı", "Yoklamayı ders günü al"],
                ["attended", "Yapıldı", "Geldi olarak işle, paketten düş"],
              ] as const
            ).map(([value, label, hint]) => (
              <label key={value} className={cn(chip, "flex-col items-start gap-0.5 px-3 py-2.5")}>
                <input
                  type="radio"
                  name="status"
                  value={value}
                  checked={status === value}
                  onChange={() => setStatus(value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs font-normal text-muted-foreground">{hint}</span>
              </label>
            ))}
          </div>
          {isPast && status === "scheduled" && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">Geçmiş tarihli bir dersi planlıyorsun.</p>
          )}
        </fieldset>
      )}
      {repeat && <input type="hidden" name="status" value="scheduled" />}
      {e.status && <p className="text-sm text-destructive">{e.status}</p>}

      <Field id="note" label="Not" hint="isteğe bağlı">
        <Textarea id="note" name="note" rows={2} />
      </Field>

      {state.conflicts && state.conflicts.length > 0 && (
        <div ref={conflictRef} tabIndex={-1} role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-500/50 outline-none bg-amber-500/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="size-4 text-amber-500" aria-hidden />
            Bu saatte başka dersin var
          </p>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            {state.conflicts.slice(0, 5).map((c) => (
              <li key={c.label}>{c.label}</li>
            ))}
            {state.conflicts.length > 5 && <li>ve {state.conflicts.length - 5} çakışma daha</li>}
          </ul>
          <Button type="submit" name="intent" value="force" variant="outline" disabled={pending} className="self-start">
            {state.count && state.count > 1 ? `Yine de ${state.count} dersi kaydet` : "Yine de kaydet"}
          </Button>
        </div>
      )}

      <Button type="submit" size="lg" disabled={pending} className="sm:self-start">
        {pending
          ? "Kaydediliyor…"
          : repeat
            ? `${occurrences.length || ""} dersi planla`.trim()
            : status === "attended"
              ? "Dersi işle"
              : "Dersi planla"}
      </Button>
    </form>
  );
}
