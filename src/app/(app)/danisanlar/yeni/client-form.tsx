"use client";

import { PHONE_PATTERN } from "@/lib/whatsapp";
import { useActionState, useState } from "react";
import { Field, FormError } from "@/components/field";
import { FieldError } from "@/components/field-error";
import { FormSubmit } from "@/components/form-submit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClientAction, updateClientAction, type ClientFormState } from "../actions";

const CONSENT_MESSAGE = "Sağlık bilgisi kaydetmek için danışanın açık rızası gerekli.";

type ClientValues = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  goals: string | null;
  notes: string | null;
  healthNotes: string | null;
};

/** New client form, or the edit form when `client` is given. */
export function ClientForm({ client, hasConsent = false }: { client?: ClientValues; hasConsent?: boolean }) {
  const [state, action, pending] = useActionState<ClientFormState, FormData>(
    client ? updateClientAction.bind(null, client.id) : createClientAction,
    {},
  );
  const v = state.values ?? (client ? toValues(client) : {});
  const e = state.errors ?? {};
  // Health notes need the client's consent, so the box becomes required once they're filled in.
  const [hasHealth, setHasHealth] = useState(!!v.healthNotes?.trim());
  // Until the box is touched, say why the button waits (FieldError speaks up after that).
  const [consentTouched, setConsentTouched] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormError message={e.form} />
      <Field id="fullName" label="Ad soyad" error={e.fullName}>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={v.fullName}
          autoComplete="off"
          required
          minLength={2}
          maxLength={120}
          autoFocus={!client}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="phone" label="Telefon" hint="WhatsApp mesajları için" error={e.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="0532 123 45 67"
            pattern={PHONE_PATTERN}
            data-invalid-message="Telefon numarasını kontrol et, örn. 0532 123 45 67."
            defaultValue={v.phone}
          />
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

      <fieldset className="flex flex-col gap-3 surface p-4">
        <legend className="px-1 text-sm font-medium">Sağlık bilgisi (isteğe bağlı)</legend>
        <Textarea
          id="healthNotes"
          name="healthNotes"
          rows={2}
          placeholder="Sakatlık, ameliyat, hamilelik, dikkat edilmesi gerekenler"
          aria-label="Sağlık notları"
          defaultValue={v.healthNotes}
          onChange={(ev) => setHasHealth(ev.target.value.trim() !== "")}
        />
        {hasConsent ? (
          <p className="text-sm text-muted-foreground">Danışanın sağlık verisi için açık rızası kayıtlı.</p>
        ) : (
          <label className="flex items-start gap-3 text-sm">
            <input
              id="healthConsent"
              type="checkbox"
              name="healthConsent"
              required={hasHealth}
              data-missing-message={CONSENT_MESSAGE}
              defaultChecked={v.healthConsent === "on"}
              onChange={() => setConsentTouched(true)}
              className="mt-0.5 size-4 accent-[var(--primary)]"
            />
            <span className="text-muted-foreground">
              Danışan, sağlık verilerinin antrenman planlaması amacıyla işlenmesine KVKK kapsamında{" "}
              <strong className="font-medium text-foreground">açık rıza</strong> verdi.
            </span>
          </label>
        )}
        {!hasConsent && hasHealth && !consentTouched && !e.healthConsent && v.healthConsent !== "on" && (
          <p className="text-sm text-muted-foreground">Sağlık bilgisini kaydetmek için rıza kutusunu işaretle.</p>
        )}
        {!hasConsent && <FieldError id="healthConsent" error={e.healthConsent} />}
      </fieldset>

      <FormSubmit size="lg" loading={pending} className="sm:self-start">
        {pending ? "Kaydediliyor…" : client ? "Değişiklikleri kaydet" : "Danışanı kaydet"}
      </FormSubmit>
    </form>
  );
}

function toValues(c: ClientValues): Record<string, string> {
  return {
    fullName: c.fullName,
    phone: c.phone ?? "",
    email: c.email ?? "",
    goals: c.goals ?? "",
    notes: c.notes ?? "",
    healthNotes: c.healthNotes ?? "",
  };
}
