"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { sendContactAction, type ContactState } from "@/app/contact-actions";
import { Field } from "@/components/field";
import { FormSubmit } from "@/components/form-submit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PHONE_PATTERN } from "@/lib/whatsapp";

/** The landing's "Bize yazın" form; it lands in /yonetim and we answer by e-mail. */
export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactAction, {});
  const e = state.errors ?? {};

  if (state.ok) {
    return (
      <div className="flex flex-col items-start gap-3 p-6 sm:p-8" role="status">
        <span className="flex size-11 items-center justify-center rounded-full bg-lime text-lime-foreground" aria-hidden>
          <CheckCircle2 className="size-5" />
        </span>
        <p className="text-lg font-semibold">Mesajınız bize ulaştı.</p>
        <p className="text-sm text-muted-foreground">En kısa sürede e-postayla dönüyoruz.</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4 p-6 sm:p-8" noValidate>
      {/* Bots fill every field; people never see this one. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Web sitesi
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contact-name" label="Adınız" error={e.name}>
          <Input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={120} data-missing-message="Adınızı yazın." />
        </Field>
        <Field id="contact-email" label="E-posta" error={e.email}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={200}
            data-missing-message="E-posta adresinizi yazın."
            data-invalid-message="Geçerli bir e-posta adresi yazın."
          />
        </Field>
      </div>
      <Field id="contact-phone" label="Telefon" hint="isteğe bağlı" error={e.phone}>
        <Input id="contact-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern={PHONE_PATTERN} data-invalid-message="Telefon numarasını kontrol edin." />
      </Field>
      <Field id="contact-message" label="Mesajınız" error={e.message}>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={4000}
          placeholder="Sorunuz, öneriniz ya da merak ettiğiniz bir özellik…"
          data-missing-message="Mesajınızı yazın."
          data-invalid-message="Mesajınız en az 10 karakter olsun."
        />
      </Field>
      {state.error && <p className="text-sm text-destructive-strong">{state.error}</p>}
      <p className="text-xs text-muted-foreground">
        Bilgilerinizi yalnızca size dönmek için kullanırız.{" "}
        <Link href="/kvkk" className="underline underline-offset-4">
          KVKK Aydınlatma Metni
        </Link>
      </p>
      <FormSubmit loading={pending} size="lg" className="sm:self-start" data-umami-event="iletisim-gonder">
        Gönder
      </FormSubmit>
    </form>
  );
}
