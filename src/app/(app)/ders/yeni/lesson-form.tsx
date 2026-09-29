"use client";

import { useActionState, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Field, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SESSION_TYPE_LABELS } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { createLessonAction, type LessonField } from "./actions";

type SessionType = keyof typeof SESSION_TYPE_LABELS;

const typeForCount = (n: number): SessionType => (n <= 1 ? "private" : n === 2 ? "duet" : n === 3 ? "trio" : "group");

export function LessonForm({
  clients,
  preselected,
  today,
  defaultTime,
  next,
}: {
  clients: { id: string; fullName: string }[];
  preselected: string[];
  today: string;
  defaultTime: string;
  next: string;
}) {
  const [state, action, pending] = useActionState<FormState<LessonField>, FormData>(createLessonAction, {});
  const e = state.errors ?? {};
  const v = state.values ?? {};

  const [selected, setSelected] = useState<string[]>(() => (v.clientIds ? v.clientIds.split(",") : preselected));
  // Follows the number of selected clients until the trainer picks a type by hand.
  const [typeOverride, setTypeOverride] = useState<SessionType | null>((v.sessionType as SessionType) || null);
  const [date, setDate] = useState(v.date || today);
  const [query, setQuery] = useState("");

  const sessionType = typeOverride ?? typeForCount(selected.length);
  const isPast = date < today;
  const [status, setStatus] = useState<"scheduled" | "attended">((v.status as "scheduled" | "attended") || "scheduled");

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return q ? clients.filter((c) => c.fullName.toLocaleLowerCase("tr").includes(q)) : clients;
  }, [clients, query]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
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
        <Field id="date" label="Tarih" error={e.date}>
          <Input
            id="date"
            name="date"
            type="date"
            value={date}
            onChange={(ev) => {
              setDate(ev.target.value);
              // A lesson in the past has almost always already happened.
              if (ev.target.value < today) setStatus("attended");
            }}
          />
        </Field>
        <Field id="time" label="Saat" error={e.time}>
          <Input id="time" name="time" type="time" step={300} defaultValue={v.time || defaultTime} />
        </Field>
        <Field id="durationMinutes" label="Süre" error={e.durationMinutes}>
          <NativeSelect id="durationMinutes" name="durationMinutes" defaultValue={v.durationMinutes || "60"}>
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

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Durum</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["scheduled", "Planlandı", "Yoklamayı ders günü al"],
              ["attended", "Yapıldı", "Geldi olarak işle, paketten düş"],
            ] as const
          ).map(([value, label, hint]) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors",
                "has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              )}
            >
              <input
                type="radio"
                name="status"
                value={value}
                checked={status === value}
                onChange={() => setStatus(value)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </label>
          ))}
        </div>
        {isPast && status === "scheduled" && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">Geçmiş tarihli bir dersi planlıyorsun.</p>
        )}
      </fieldset>

      <Field id="note" label="Not" hint="isteğe bağlı">
        <Textarea id="note" name="note" rows={2} defaultValue={v.note} />
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="sm:self-start">
        {pending ? "Kaydediliyor…" : status === "attended" ? "Dersi işle" : "Dersi planla"}
      </Button>
    </form>
  );
}
