"use client";

import { useActionState, useEffect, useState } from "react";
import { Field } from "@/components/field";
import { FormSubmit } from "@/components/form-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, type LoginState } from "./actions";

// Matches Supabase's default minimum interval between emails to one address.
const RESEND_AFTER_SECONDS = 60;
// Same as the server: 6–10 digits, spaces ignored.
const CODE_PATTERN = String.raw`\s*(?:[0-9]\s*){6,10}`;

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, { step: "email" });

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      {state.step === "email" ? <EmailStep state={state} pending={pending} /> : <CodeStep state={state} pending={pending} />}
    </form>
  );
}

function EmailStep({ state, pending }: { state: Extract<LoginState, { step: "email" }>; pending: boolean }) {
  return (
    <>
      <Field id="email" label="E-posta" error={state.error}>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          data-missing-message="E-posta adresini yaz."
          placeholder="ornek@mail.com"
          defaultValue={state.email}
          required
          autoFocus
        />
      </Field>
      <FormSubmit size="lg" loading={pending} data-umami-event="giris-kod-iste">
        {pending ? "Gönderiliyor…" : "Giriş kodu gönder"}
      </FormSubmit>
    </>
  );
}

function CodeStep({ state, pending }: { state: Extract<LoginState, { step: "code" }>; pending: boolean }) {
  const secondsLeft = useSecondsUntil(state.sentAt + RESEND_AFTER_SECONDS * 1000);

  return (
    <>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{state.email}</span> adresine bir giriş kodu gönderdik.
        {state.resent && " Yeni kod gönderildi."}
      </p>
      <Field id="code" label="Kod" error={state.error}>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern={CODE_PATTERN}
          data-missing-message="E-postana gelen kodu yaz."
          data-invalid-message="E-postadaki kodu eksiksiz yaz."
          maxLength={14}
          placeholder="123456"
          className="h-14 text-center text-2xl font-semibold tracking-[0.4em] tabular-nums md:h-14 md:text-2xl"
          required
          autoFocus
        />
      </Field>
      <FormSubmit size="lg" loading={pending}>
        {pending ? "Kontrol ediliyor…" : "Giriş yap"}
      </FormSubmit>
      <div className="flex items-center justify-between text-sm">
        <Button type="submit" name="intent" value="change-email" variant="link" className="h-11 px-0 md:h-auto" formNoValidate>
          E-postayı değiştir
        </Button>
        <Button
          type="submit"
          name="intent"
          value="resend"
          variant="link"
          className="h-11 px-0 md:h-auto"
          disabled={pending || secondsLeft > 0}
          formNoValidate
        >
          {secondsLeft > 0 ? `Tekrar gönder (${secondsLeft})` : "Kodu tekrar gönder"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Kod 1 saat geçerli. Gelmediyse spam klasörüne bak; bir dakika sonra yeni kod isteyebilirsin.
      </p>
    </>
  );
}

/** Whole seconds remaining until `deadline` (ms timestamp), ticking every second. */
function useSecondsUntil(deadline: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
