"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "./actions";

// Matches Supabase's default minimum interval between emails to one address.
const RESEND_AFTER_SECONDS = 60;

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
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="ornek@mail.com"
          defaultValue={state.email}
          required
          autoFocus
          aria-invalid={!!state.error || undefined}
          aria-describedby={state.error ? "email-error" : undefined}
        />
        {state.error && (
          <p id="email-error" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" loading={pending}>
        {pending ? "Gönderiliyor…" : "Giriş kodu gönder"}
      </Button>
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Kod</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={10}
          placeholder="123456"
          className="h-12 text-center text-xl tracking-[0.4em] tabular-nums"
          required
          autoFocus
          aria-invalid={!!state.error || undefined}
          aria-describedby={state.error ? "code-error" : undefined}
        />
        {state.error && (
          <p id="code-error" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" loading={pending}>
        {pending ? "Kontrol ediliyor…" : "Giriş yap"}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <Button type="submit" name="intent" value="change-email" variant="link" className="h-auto p-0" formNoValidate>
          E-postayı değiştir
        </Button>
        <Button
          type="submit"
          name="intent"
          value="resend"
          variant="link"
          className="h-auto p-0"
          disabled={pending || secondsLeft > 0}
          formNoValidate
        >
          {secondsLeft > 0 ? `Tekrar gönder (${secondsLeft})` : "Kodu tekrar gönder"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Kod gelmediyse spam klasörüne bak. E-postadaki bağlantıya tıklayarak da girebilirsin.
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
