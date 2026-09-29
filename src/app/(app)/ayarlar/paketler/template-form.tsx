"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Field, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SESSION_TYPE_LABELS } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { createTemplateAction } from "./actions";

// One tap fills the common Turkish package shapes.
const PRESETS = [
  { name: "8 Ders Özel", sessionType: "private", sessionCount: 8, validityDays: 35, makeupAllowance: 1 },
  { name: "12 Ders Özel", sessionType: "private", sessionCount: 12, validityDays: 49, makeupAllowance: 2 },
  { name: "8 Ders Düet", sessionType: "duet", sessionCount: 8, validityDays: 35, makeupAllowance: 1 },
  { name: "10 Ders Grup", sessionType: "group", sessionCount: 10, validityDays: 60, makeupAllowance: 1 },
] as const;

export function TemplateForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createTemplateAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const v = state.values ?? {};
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.savedAt) toast.success("Paket şablonu eklendi");
  }, [state.savedAt]);

  function applyPreset(p: (typeof PRESETS)[number]) {
    const form = formRef.current;
    if (!form) return;
    for (const [key, value] of Object.entries(p)) {
      const el = form.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | null;
      if (el) el.value = String(value);
    }
    (form.elements.namedItem("price") as HTMLInputElement | null)?.focus();
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="flex flex-wrap gap-2" aria-label="Hazır şablonlar">
        {PRESETS.map((p) => (
          <Button key={p.name} type="button" variant="outline" size="sm" onClick={() => applyPreset(p)}>
            {p.name}
          </Button>
        ))}
      </div>

      <Field id="name" label="Paket adı" error={e.name}>
        <Input id="name" name="name" placeholder="Örn. 8 Ders Özel Reformer" defaultValue={v.name} required />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="sessionType" label="Ders türü" error={e.sessionType}>
          <NativeSelect id="sessionType" name="sessionType" defaultValue={v.sessionType ?? "private"}>
            {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="sessionCount" label="Ders sayısı" error={e.sessionCount}>
          <Input id="sessionCount" name="sessionCount" type="number" inputMode="numeric" min={1} defaultValue={v.sessionCount ?? "8"} />
        </Field>
        <Field id="price" label="Fiyat (₺)" error={e.price}>
          <Input id="price" name="price" inputMode="decimal" placeholder="4.000" defaultValue={v.price} />
        </Field>
        <Field id="validityDays" label="Geçerlilik (gün)" error={e.validityDays}>
          <Input
            id="validityDays"
            name="validityDays"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="süresiz"
            defaultValue={v.validityDays ?? "35"}
          />
        </Field>
      </div>

      <Field
        id="makeupAllowance"
        label="Telafi hakkı"
        hint="geç iptalde yanmayan ders sayısı"
        error={e.makeupAllowance}
      >
        <Input
          id="makeupAllowance"
          name="makeupAllowance"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={v.makeupAllowance ?? "1"}
          className="max-w-24"
        />
      </Field>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Ekleniyor…" : "Şablonu ekle"}
      </Button>
    </form>
  );
}
