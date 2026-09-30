"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { FieldError } from "@/components/field-error";
import { FormSubmit } from "@/components/form-submit";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { saveProfile, type ProfileFormState } from "./actions";

const DISCIPLINES = [
  { value: "pt", label: "Personal trainer" },
  { value: "pilates", label: "Pilates" },
  { value: "both", label: "İkisi de" },
] as const;

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfile, {});
  const v = state.values ?? { fullName: defaultName };
  const e = state.errors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field id="fullName" label="Adın soyadın" error={e.fullName}>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          defaultValue={v.fullName}
          required
          minLength={2}
          maxLength={120}
          data-missing-message="Adını yaz."
          autoFocus
        />
      </Field>

      <Field id="businessName" label="Stüdyo / işletme adı" hint="isteğe bağlı" error={e.businessName}>
        <Input id="businessName" name="businessName" defaultValue={v.businessName} maxLength={120} autoComplete="organization" />
        <p className="text-xs text-muted-foreground">Danışanların kendi sayfalarında bu adı görür.</p>
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Branşın</legend>
        <div className="grid grid-cols-3 gap-2">
          {DISCIPLINES.map((d) => (
            <label
              key={d.value}
              className={cn(
                "flex min-h-12 cursor-pointer items-center justify-center rounded-xl border bg-card px-2 py-3 text-center text-sm font-medium transition-colors hover:bg-muted/60",
                "has-[:checked]:border-transparent has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
              )}
            >
              <input
                id={`discipline-${d.value}`}
                type="radio"
                name="discipline"
                required
                value={d.value}
                defaultChecked={(v.discipline ?? "both") === d.value}
                className="sr-only"
              />
              {d.label}
            </label>
          ))}
        </div>
        <FieldError id="discipline-pt" error={e.discipline} />
      </fieldset>

      <FormSubmit size="lg" loading={pending}>
        {pending ? "Kaydediliyor…" : "Başla"}
      </FormSubmit>
    </form>
  );
}
