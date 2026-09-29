"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClientAction, type ClientFormState } from "../actions";

export function ClientForm() {
  const [state, action, pending] = useActionState<ClientFormState, FormData>(createClientAction, {});
  const v = state.values ?? {};
  const e = state.errors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field id="fullName" label="Ad soyad" error={e.fullName}>
        <Input id="fullName" name="fullName" defaultValue={v.fullName} autoComplete="off" required autoFocus />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="phone" label="Telefon" hint="WhatsApp mesajları için" error={e.phone}>
          <Input id="phone" name="phone" type="tel" inputMode="tel" placeholder="0532 123 45 67" defaultValue={v.phone} />
        </Field>
        <Field id="email" label="E-posta" error={e.email}>
          <Input id="email" name="email" type="email" inputMode="email" defaultValue={v.email} />
        </Field>
      </div>

      <Field id="goals" label="Hedef">
        <Input id="goals" name="goals" placeholder="Örn. duruş, kilo verme, bel ağrısı" defaultValue={v.goals} />
      </Field>

      <Field id="notes" label="Notlar">
        <Textarea id="notes" name="notes" rows={3} defaultValue={v.notes} />
      </Field>

      <fieldset className="flex flex-col gap-3 rounded-xl border p-4">
        <legend className="px-1 text-sm font-medium">Sağlık bilgisi (isteğe bağlı)</legend>
        <Textarea
          id="healthNotes"
          name="healthNotes"
          rows={2}
          placeholder="Sakatlık, ameliyat, hamilelik, dikkat edilmesi gerekenler"
          aria-label="Sağlık notları"
          defaultValue={v.healthNotes}
        />
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="healthConsent"
            defaultChecked={v.healthConsent === "on"}
            className="mt-0.5 size-4 accent-[var(--primary)]"
            aria-describedby="healthConsent-error"
          />
          <span className="text-muted-foreground">
            Danışan, sağlık verilerinin antrenman planlaması amacıyla işlenmesine KVKK kapsamında{" "}
            <strong className="font-medium text-foreground">açık rıza</strong> verdi.
          </span>
        </label>
        {e.healthConsent && (
          <p id="healthConsent-error" className="text-sm text-destructive">
            {e.healthConsent}
          </p>
        )}
      </fieldset>

      <Button type="submit" size="lg" disabled={pending} className="sm:self-start">
        {pending ? "Kaydediliyor…" : "Danışanı kaydet"}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label}
        {hint && <span className="font-normal text-muted-foreground">· {hint}</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
