"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Field, FormError } from "@/components/field";
import { IntakeInput } from "@/components/intake-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SESSION_TYPE_LABELS, formatTRY } from "@/lib/format";
import { answerName, type IntakeFieldDef } from "@/lib/intake";
import { submitWithoutReset } from "@/lib/use-form-submit";
import { useScrollIntoView } from "@/lib/use-scroll-into-view";
import { cn } from "@/lib/utils";
import type { SignupState } from "./actions";

type Pkg = { id: string; name: string; sessionType: keyof typeof SESSION_TYPE_LABELS; sessionCount: number; price: string | null };

export function SignupForm({
  action: serverAction,
  packages,
  fields,
  initialPackageId,
  trainerName,
}: {
  action: (prev: SignupState, formData: FormData) => Promise<SignupState>;
  packages: Pkg[];
  fields: (IntakeFieldDef & { id: string })[];
  initialPackageId: string;
  trainerName: string;
}) {
  const [state, action, pending] = useActionState<SignupState, FormData>(serverAction, {});
  const e = state.errors ?? {};
  const [pkgId, setPkgId] = useState(initialPackageId || packages[0]?.id || "");
  const [healthConsent, setHealthConsent] = useState(false);
  const errorRef = useScrollIntoView<HTMLDivElement>(state.errors);

  const general = fields.filter((f) => !f.isHealth);
  const health = fields.filter((f) => f.isHealth);

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-8" noValidate>
      {/* Honeypot: hidden from people, filled by bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Web sitesi
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {Object.keys(e).length > 0 && (
        <div ref={errorRef} tabIndex={-1} className="outline-none">
          <FormError message={e.form ?? "Formda eksik ya da hatalı alanlar var."} />
        </div>
      )}

      <fieldset>
        <legend className="mb-3 text-base font-semibold">Paket</legend>
        <input type="hidden" name="templateId" value={pkgId} />
        <div className="flex flex-col gap-2">
          {packages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPkgId(p.id)}
              aria-pressed={pkgId === p.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                pkgId === p.id ? "border-primary bg-primary/10" : "hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  pkgId === p.id && "border-primary bg-primary text-primary-foreground",
                )}
                aria-hidden
              >
                {pkgId === p.id && <Check className="size-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{p.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {SESSION_TYPE_LABELS[p.sessionType]} · {p.sessionCount} ders
                </span>
              </span>
              {p.price && <span className="font-semibold tabular-nums">{formatTRY(p.price)}</span>}
            </button>
          ))}
        </div>
        {e.templateId && <p className="mt-2 text-sm text-destructive">{e.templateId}</p>}
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-base font-semibold">Bilgilerin</legend>
        <div className="grid grid-cols-2 gap-3">
          <Field id="firstName" label="Ad" error={e.firstName}>
            <Input id="firstName" name="firstName" autoComplete="given-name" aria-invalid={!!e.firstName || undefined} />
          </Field>
          <Field id="lastName" label="Soyad" error={e.lastName}>
            <Input id="lastName" name="lastName" autoComplete="family-name" aria-invalid={!!e.lastName || undefined} />
          </Field>
        </div>
        <Field id="phone" label="Telefon" hint="WhatsApp" error={e.phone}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0532 123 45 67"
            aria-invalid={!!e.phone || undefined}
          />
        </Field>
        <Field id="email" label="E-posta" hint="kişisel linkini buraya da gönderelim" error={e.email}>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" aria-invalid={!!e.email || undefined} />
        </Field>
        {general.map((f) => (
          <IntakeInput key={f.id} field={f} error={e[answerName(f.id)]} />
        ))}
      </fieldset>

      {health.length > 0 && (
        <fieldset className="flex flex-col gap-4 rounded-2xl border p-4">
          <legend className="flex items-center gap-2 px-1 text-base font-semibold">
            <ShieldCheck className="size-4 text-primary" aria-hidden />
            Sağlık bilgileri
          </legend>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="healthConsent"
              checked={healthConsent}
              onChange={(ev) => setHealthConsent(ev.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
            />
            <span className="text-muted-foreground">
              Sağlık ve vücut ölçüsü bilgilerimin, derslerimin güvenli ve bana uygun planlanması amacıyla {trainerName} tarafından
              işlenmesine <strong className="font-medium text-foreground">açık rıza</strong> veriyorum. Vermek zorunda değilim; istediğim
              zaman geri alabilirim.
            </span>
          </label>
          {healthConsent ? (
            health.map((f) => <IntakeInput key={f.id} field={f} error={e[answerName(f.id)]} />)
          ) : (
            <p className="text-xs text-muted-foreground">
              Rıza vermezsen bu bölümü atlayabilirsin; bilgileri eğitmenine derste de iletebilirsin.
            </p>
          )}
        </fieldset>
      )}

      <Field id="message" label="Eklemek istediğin bir şey var mı?" hint="isteğe bağlı">
        <Textarea id="message" name="message" rows={2} maxLength={1000} />
      </Field>

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="kvkk" className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" aria-invalid={!!e.kvkk || undefined} />
          <span className="text-muted-foreground">
            <Link href="/kvkk" target="_blank" className="font-medium text-foreground underline underline-offset-2">
              KVKK aydınlatma metnini
            </Link>{" "}
            okudum; bilgilerimin başvurumun değerlendirilmesi ve derslerimin yürütülmesi için işlenmesini anladım.
          </span>
        </label>
        {e.kvkk && <p className="text-sm text-destructive">{e.kvkk}</p>}
      </div>

      <Button type="submit" size="lg" disabled={pending || !pkgId}>
        {pending ? "Gönderiliyor…" : "Başvuruyu gönder"}
      </Button>
    </form>
  );
}
