"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { Field, FormError, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitWithoutReset } from "@/lib/use-form-submit";
import { useScrollIntoView } from "@/lib/use-scroll-into-view";
import { rescheduleAction, type RescheduleState } from "./actions";

const DURATIONS = [30, 45, 50, 55, 60, 75, 90];

export function RescheduleForm({
  lessonId,
  date,
  time,
  durationMinutes,
}: {
  lessonId: string;
  date: string;
  time: string;
  durationMinutes: number;
}) {
  const [state, action, pending] = useActionState<RescheduleState, FormData>(rescheduleAction, {});
  const conflictRef = useScrollIntoView<HTMLDivElement>(state.conflicts);
  // Open from the moment the trainer taps "change" until the next successful save.
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const open = openedAt !== null && !(state.savedAt && state.savedAt > openedAt);
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.savedAt) toast.success("Ders saati güncellendi");
  }, [state.savedAt]);

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpenedAt(Date.now())}>
        <Clock />
        Saati değiştir
      </Button>
    );
  }

  const durations = DURATIONS.includes(durationMinutes) ? DURATIONS : [...DURATIONS, durationMinutes].sort((a, b) => a - b);

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-4 rounded-xl border p-4" noValidate>
      <input type="hidden" name="lessonId" value={lessonId} />
      <FormError message={e.lessonId} />
      <div className="grid grid-cols-3 gap-3">
        <Field id="r-date" label="Tarih" error={e.date}>
          <Input id="r-date" name="date" type="date" defaultValue={date} />
        </Field>
        <Field id="r-time" label="Saat" error={e.time}>
          <Input id="r-time" name="time" type="time" step={300} defaultValue={time} />
        </Field>
        <Field id="r-duration" label="Süre">
          <NativeSelect id="r-duration" name="durationMinutes" defaultValue={durationMinutes}>
            {durations.map((m) => (
              <option key={m} value={m}>
                {m} dk
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      {state.conflicts && state.conflicts.length > 0 && (
        <div ref={conflictRef} tabIndex={-1} role="alert" className="flex flex-col gap-2 rounded-lg border border-warning/50 outline-none bg-warning/10 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 text-warning" aria-hidden />
            Bu saatte başka dersin var
          </p>
          <ul className="text-muted-foreground">
            {state.conflicts.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <Button type="submit" name="intent" value="force" variant="outline" size="sm" disabled={pending} className="self-start">
            Yine de taşı
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpenedAt(null)}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
