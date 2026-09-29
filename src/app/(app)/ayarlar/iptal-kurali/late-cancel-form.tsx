"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Field, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";
import { saveLateCancelAction } from "./actions";
import { LATE_CANCEL_OPTIONS, lateCancelLabel } from "./options";

export function LateCancelForm({ initial }: { initial: number }) {
  const [state, action, pending] = useActionState<FormState<"lateCancelHours">, FormData>(saveLateCancelAction, {});
  const [hours, setHours] = useState(initial);

  useEffect(() => {
    if (state.savedAt) toast.success("Geç iptal kuralı kaydedildi");
  }, [state.savedAt]);

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field id="lateCancelHours" label="Dersten en geç kaç saat önce ücretsiz iptal edilebilsin?" error={state.errors?.lateCancelHours}>
        <NativeSelect
          id="lateCancelHours"
          name="lateCancelHours"
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="max-w-72"
        >
          {LATE_CANCEL_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {lateCancelLabel(h)}
            </option>
          ))}
        </NativeSelect>
      </Field>

      {/* A concrete example makes the rule obvious. */}
      <p className="rounded-2xl bg-muted p-4 text-sm leading-relaxed">
        {hours === 0 ? (
          <>Danışan dersten hemen önce bile iptal etse ders paketinden düşmez. Yoklamada &quot;Geç iptal&quot;i yine elle işaretleyebilirsin.</>
        ) : (
          <>
            Örnek: ders <strong className="font-medium">Salı 18:00</strong>&apos;de. Danışan{" "}
            <strong className="font-medium">{example(hours)}</strong> öncesine kadar iptal ederse ders paketinden düşmez. Daha geç iptal
            ederse <strong className="font-medium">geç iptal</strong> sayılır ve ders yanar; paketinde telafi hakkı varsa önce o kullanılır.
          </>
        )}
      </p>

      <Button type="submit" loading={pending} className="sm:self-start">
        Kaydet
      </Button>
    </form>
  );
}

const DAYS = ["Salı", "Pazartesi", "Pazar", "Cumartesi"];

/** The latest free-cancel moment for a Tuesday 18:00 lesson, e.g. 24 h → "Pazartesi 18:00". */
function example(hours: number) {
  const t = 18 * 60 - hours * 60;
  const daysBack = t < 0 ? Math.ceil(-t / 1440) : 0;
  const m = t + daysBack * 1440;
  return `${DAYS[daysBack]} ${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
