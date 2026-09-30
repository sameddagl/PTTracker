"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, Check, Repeat, Search } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Field, NativeSelect } from "@/components/field";
import { FormSubmit } from "@/components/form-submit";
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
  "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring";

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
  const [done, setDone] = useState(true);
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
        <ul className="max-h-72 divide-y overflow-y-auto surface">
          {visible.map((c) => {
            const on = selected.includes(c.id);
            return (
              <li key={c.id}>
                <label className={cn("flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/50", on && "bg-muted/60")}>
                  <input type="checkbox" checked={on} onChange={() => toggle(c.id)} className="peer sr-only" />
                  <Avatar name={c.fullName} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.fullName}</span>
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                      on ? "border-transparent bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                </label>
              </li>
            );
          })}
          {visible.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted-foreground">Sonuç yok</li>}
        </ul>
        {e.clientIds ? (
          <p className="text-sm text-destructive-strong">{e.clientIds}</p>
        ) : (
          selected.length === 0 && <p className="text-sm text-muted-foreground">En az bir danışan seç.</p>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <Field id="date" label={repeat ? "Başlangıç" : "Tarih"} error={e.date}>
          <Input id="date" name="date" type="date" required data-missing-message="Tarih seç." value={date} onChange={(ev) => changeDate(ev.target.value)} />
        </Field>
        <Field id="time" label="Saat" error={e.time}>
          <Input id="time" name="time" type="time" required data-missing-message="Saat seç." defaultValue={defaultTime} />
        </Field>
        <Field id="durationMinutes" label="Süre" error={e.durationMinutes}>
          <NativeSelect id="durationMinutes" name="durationMinutes" required defaultValue="60">
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

      <fieldset className="flex flex-col gap-3 surface p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="repeat"
            checked={repeat}
            onChange={(ev) => {
              setRepeat(ev.target.checked);
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
                <label key={label} className={cn(chip, "h-11 text-xs")}>
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
            {e.weekdays ? (
              <p className="text-sm text-destructive-strong">{e.weekdays}</p>
            ) : (
              weekdays.length === 0 && <p className="text-sm text-muted-foreground">En az bir gün seç.</p>
            )}
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
                : weekdays.length > 0 && "Seçtiğin günler bu aralığa denk gelmiyor."}
            </p>
          </>
        )}
      </fieldset>

      {/* A lesson in the past is usually being recorded after the fact. */}
      <input type="hidden" name="status" value={!repeat && isPast && done ? "attended" : "scheduled"} />
      {!repeat && isPast && (
        <label className="flex cursor-pointer items-start gap-3 surface p-4">
          <input type="checkbox" checked={done} onChange={(ev) => setDone(ev.target.checked)} className="mt-0.5 size-4 accent-[var(--primary)]" />
          <span className="text-sm">
            <span className="block font-medium">Bu ders yapıldı</span>
            <span className="block text-muted-foreground">Tarih geçmişte. Danışanlar &quot;Geldi&quot; olarak işaretlenir, ders paketlerinden düşer.</span>
          </span>
        </label>
      )}
      {e.status && <p className="text-sm text-destructive-strong">{e.status}</p>}

      <Field id="note" label="Not" hint="isteğe bağlı">
        <Textarea id="note" name="note" rows={2} maxLength={500} />
      </Field>

      {state.conflicts && state.conflicts.length > 0 && (
        <div ref={conflictRef} tabIndex={-1} role="alert" className="flex flex-col gap-3 surface border-warning/50 outline-none bg-warning/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="size-4 text-warning" aria-hidden />
            Bu saatte başka dersin var
          </p>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            {state.conflicts.slice(0, 5).map((c) => (
              <li key={c.label}>{c.label}</li>
            ))}
            {state.conflicts.length > 5 && <li>ve {state.conflicts.length - 5} çakışma daha</li>}
          </ul>
          <FormSubmit always name="intent" value="force" variant="outline" disabled={pending} className="self-start">
            {state.count && state.count > 1 ? `Yine de ${state.count} dersi kaydet` : "Yine de kaydet"}
          </FormSubmit>
        </div>
      )}

      <FormSubmit
        size="lg"
        loading={pending}
        disabled={selected.length === 0 || (repeat && occurrences.length === 0)}
        className="sm:self-start"
      >
        {pending
          ? "Kaydediliyor…"
          : repeat
            ? `${occurrences.length || ""} dersi planla`.trim()
            : isPast && done
              ? "Dersi kaydet"
              : "Dersi planla"}
      </FormSubmit>
    </form>
  );
}
