"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Field, NativeSelect } from "@/components/field";
import { FormSubmit } from "@/components/form-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/forms";
import { INTAKE_TYPE_LABELS, INTAKE_TYPES, type IntakeType } from "@/lib/intake";
import { submitWithoutReset } from "@/lib/use-form-submit";
import { saveIntakeFieldAction, type IntakeFieldFormField } from "./actions";

// Digits with Turkish separators ("72,5", "1.250"), as parseTRY reads them.
const NUMBER_PATTERN = String.raw`[\s+\-0-9.,]*[0-9][\s0-9.,]*`;

export type EditableField = {
  id?: string;
  label: string;
  type: IntakeType;
  helpText: string;
  unit: string;
  min: string;
  max: string;
  options: string;
  required: boolean;
  isHealth: boolean;
  isActive: boolean;
};

export const NEW_FIELD: EditableField = {
  label: "",
  type: "short_text",
  helpText: "",
  unit: "",
  min: "",
  max: "",
  options: "",
  required: false,
  isHealth: false,
  isActive: true,
};

export function FieldEditor({ initial, onDone }: { initial: EditableField; onDone: () => void }) {
  const [state, action, pending] = useActionState<FormState<IntakeFieldFormField>, FormData>(saveIntakeFieldAction, {});
  const e = state.errors ?? {};
  const [type, setType] = useState<IntakeType>(initial.type);
  const isChoice = type === "single_choice" || type === "multi_choice";
  // Ids stay unique when several questions are open for editing.
  const key = initial.id ?? "new";

  useEffect(() => {
    if (!state.savedAt) return;
    toast.success(initial.id ? "Soru güncellendi" : "Soru eklendi");
    onDone();
  }, [state.savedAt, initial.id, onDone]);

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-4 surface bg-muted/30 p-4" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <Field id={`label-${key}`} label="Soru" error={e.label}>
        <Input
          id={`label-${key}`}
          name="label"
          defaultValue={initial.label}
          placeholder="Örn. Daha önce pilates yaptın mı?"
          required
          maxLength={80}
          data-missing-message="Soruyu yaz."
          autoFocus
        />
      </Field>

      <Field id={`type-${key}`} label="Cevap tipi" error={e.type}>
        <NativeSelect
          id={`type-${key}`}
          required
          name="type"
          value={type}
          onChange={(ev) => setType(ev.target.value as IntakeType)}
        >
          {INTAKE_TYPES.map((t) => (
            <option key={t} value={t}>
              {INTAKE_TYPE_LABELS[t]}
            </option>
          ))}
        </NativeSelect>
      </Field>

      {type === "number" && (
        <div className="grid grid-cols-3 gap-3">
          <Field id={`unit-${key}`} label="Birim" hint="isteğe bağlı" error={e.unit}>
            <Input id={`unit-${key}`} name="unit" defaultValue={initial.unit} placeholder="kg, cm, dk…" maxLength={12} />
          </Field>
          <Field id={`min-${key}`} label="En az" hint="isteğe bağlı" error={e.min}>
            <Input
              id={`min-${key}`}
              name="min"
              inputMode="decimal"
              pattern={NUMBER_PATTERN}
              data-invalid-message="Sayı gir."
              defaultValue={initial.min}
            />
          </Field>
          <Field id={`max-${key}`} label="En çok" hint="isteğe bağlı" error={e.max}>
            <Input
              id={`max-${key}`}
              name="max"
              inputMode="decimal"
              pattern={NUMBER_PATTERN}
              data-invalid-message="Sayı gir."
              defaultValue={initial.max}
            />
          </Field>
        </div>
      )}

      {isChoice && (
        <Field id={`options-${key}`} label="Seçenekler" hint="her satıra bir seçenek" error={e.options}>
          <Textarea
            id={`options-${key}`}
            name="options"
            rows={4}
            defaultValue={initial.options}
            placeholder={"Sabah\nÖğle\nAkşam"}
            required
            data-missing-message="En az 2 seçenek yaz."
          />
        </Field>
      )}

      <Field id={`helpText-${key}`} label="Açıklama" hint="isteğe bağlı, sorunun altında görünür" error={e.helpText}>
        <Input id={`helpText-${key}`} name="helpText" defaultValue={initial.helpText} maxLength={200} />
      </Field>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="required" defaultChecked={initial.required} className="size-4 accent-[var(--primary)]" />
          Zorunlu
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="isHealth" defaultChecked={initial.isHealth} className="mt-0.5 size-4 accent-[var(--primary)]" />
          <span>
            Sağlık bilgisi
            <span className="block text-xs text-muted-foreground">
              KVKK gereği bu soruyu yalnızca açık rıza veren danışan görür. Rıza vermeyen, soru zorunlu olsa da boş geçebilir.
            </span>
          </span>
        </label>
        {initial.id && (
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={initial.isActive} className="size-4 accent-[var(--primary)]" />
            Formda göster
          </label>
        )}
        {!initial.id && <input type="hidden" name="isActive" value="on" />}
      </div>

      <div className="flex gap-2">
        <FormSubmit loading={pending}>
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </FormSubmit>
        <Button type="button" variant="ghost" onClick={onDone}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
