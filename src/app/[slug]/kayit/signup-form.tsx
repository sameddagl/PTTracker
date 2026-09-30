"use client";

import { useActionState, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Field, FormError } from "@/components/field";
import { PriceTag } from "@/components/price-tag";
import { IntakeInput } from "@/components/intake-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SESSION_TYPE_LABELS, formatTRY } from "@/lib/format";
import { answerName, type IntakeFieldDef } from "@/lib/intake";
import { monthlyAmount, paymentOptions, type PricedTemplate } from "@/lib/pricing";
import { submitWithoutReset } from "@/lib/use-form-submit";
import { useScrollIntoView } from "@/lib/use-scroll-into-view";
import { cn } from "@/lib/utils";
import type { SignupState } from "./actions";

type Pkg = PricedTemplate & {
  id: string;
  name: string;
  sessionType: keyof typeof SESSION_TYPE_LABELS;
  sessionCount: number;
};

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
  const [installments, setInstallments] = useState(1);
  const selected = packages.find((p) => p.id === pkgId);
  const options = selected ? paymentOptions(selected) : [];
  // Keep the pick valid when switching packages (e.g. one without installments).
  const plan = options.find((o) => o.installments === installments) ?? options[0];
  const [healthConsent, setHealthConsent] = useState(false);
  const errorRef = useScrollIntoView<HTMLDivElement>(state.errors);

  const general = fields.filter((f) => !f.isHealth);
  const health = fields.filter((f) => f.isHealth);

  // Step numbers follow the sections actually shown.
  let n = 0;
  const step = {
    package: ++n,
    payment: options.length > 1 ? ++n : 0,
    details: ++n,
    health: health.length > 0 ? ++n : 0,
    consent: ++n,
  };

  return (
    <form
      onSubmit={submitWithoutReset(action)}
      className="flex flex-col gap-4 [&_[data-slot=label]]:flex-wrap [&_[data-slot=label]]:gap-x-1.5 [&_[data-slot=label]]:gap-y-1 [&_[data-slot=label]]:leading-snug"
      noValidate
    >
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

      <div className="surface p-4 sm:p-5">
        <fieldset>
          <StepLegend n={step.package}>Paket</StepLegend>
          <input type="hidden" name="templateId" value={pkgId} />
          <div className="flex flex-col gap-2">
            {packages.map((p) => {
              const on = pkgId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPkgId(p.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex min-h-16 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                    on ? "border-transparent bg-card ring-2 ring-primary" : "bg-card hover:bg-muted/60",
                  )}
                >
                  <SelectDot on={on} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {SESSION_TYPE_LABELS[p.sessionType]} · {p.sessionCount} ders
                    </span>
                  </span>
                  {p.price ? (
                    <PriceTag price={p.price} compareAtPrice={p.compareAtPrice} className="max-w-32" />
                  ) : (
                    p.installmentPrice && <span className="font-semibold tabular-nums">{formatTRY(p.installmentPrice)}</span>
                  )}
                </button>
              );
            })}
          </div>
          {e.templateId && <p className="mt-2 text-sm text-destructive-strong">{e.templateId}</p>}
        </fieldset>
      </div>

      <input type="hidden" name="installments" value={plan?.installments ?? 1} />
      {options.length > 1 && (
        <div className="surface p-4 sm:p-5">
          <fieldset>
            <StepLegend n={step.payment}>Ödeme şekli</StepLegend>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.map((o) => {
                const on = plan?.installments === o.installments;
                return (
                  <button
                    key={o.installments}
                    type="button"
                    onClick={() => setInstallments(o.installments)}
                    aria-pressed={on}
                    className={cn(
                      "flex min-h-16 items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                      on ? "border-transparent bg-card ring-2 ring-primary" : "bg-card hover:bg-muted/60",
                    )}
                  >
                    <SelectDot on={on} className="mt-0.5" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-semibold">{o.installments > 1 ? `${o.installments} taksit` : "Peşin"}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {o.installments > 1
                          ? `${o.installments} × ${formatTRY(monthlyAmount(o))} · toplam ${formatTRY(o.total)}`
                          : `Tek seferde ${formatTRY(o.total)}`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {e.installments && <p className="mt-2 text-sm text-destructive-strong">{e.installments}</p>}
            {plan && plan.installments > 1 && (
              <p className="mt-3 text-sm text-muted-foreground">İlk taksit paket başladığında, sonrakiler 30 gün arayla.</p>
            )}
          </fieldset>
        </div>
      )}

      <div className="surface p-4 sm:p-5">
        <fieldset className="flex flex-col gap-4">
          <StepLegend n={step.details}>Bilgilerin</StepLegend>
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
          <Field id="email" label="E-posta" hint="kişisel linkini buraya da göndeririz" error={e.email}>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-invalid={!!e.email || undefined}
            />
          </Field>
          {general.map((f) => (
            <IntakeInput key={f.id} field={f} error={e[answerName(f.id)]} />
          ))}
        </fieldset>
      </div>

      {health.length > 0 && (
        <div className="surface p-4 sm:p-5">
          <fieldset className="flex flex-col gap-4">
            <StepLegend n={step.health} icon={<ShieldCheck className="size-4 text-success-strong" aria-hidden />}>
              Sağlık bilgileri
            </StepLegend>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-muted/60 p-3 text-sm">
              <input
                type="checkbox"
                name="healthConsent"
                checked={healthConsent}
                onChange={(ev) => setHealthConsent(ev.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
              />
              <span className="text-muted-foreground">
                Sağlık ve vücut ölçüsü bilgilerimin, derslerimin güvenli ve bana uygun planlanması amacıyla {trainerName}{" "}
                tarafından işlenmesine{" "}
                <Link href="/acik-riza" target="_blank" className="font-medium text-foreground underline underline-offset-2">
                  Açık Rıza Metni
                </Link>{" "}
                kapsamında açık rıza veriyorum. Vermek zorunda değilim; istediğim zaman geri alabilirim.
              </span>
            </label>
            {healthConsent ? (
              health.map((f) => <IntakeInput key={f.id} field={f} error={e[answerName(f.id)]} />)
            ) : (
              <p className="text-xs text-muted-foreground">
                İstemezsen bu bölümü boş geç; bu bilgileri eğitmenine derste de söyleyebilirsin.
              </p>
            )}
          </fieldset>
        </div>
      )}

      <div className="surface p-4 sm:p-5">
        <fieldset className="flex flex-col gap-4">
          <StepLegend n={step.consent}>Son adım</StepLegend>
          <Field id="message" label="Eklemek istediğin bir şey var mı?" hint="isteğe bağlı">
            <Textarea id="message" name="message" rows={2} maxLength={1000} />
          </Field>

          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-muted/60 p-3 text-sm">
              <input
                type="checkbox"
                name="kvkk"
                className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
                aria-invalid={!!e.kvkk || undefined}
              />
              <span className="text-muted-foreground">
                Bilgilerimin başvurumun değerlendirilmesi ve derslerimin yürütülmesi için veri sorumlusu {trainerName} tarafından
                işleneceğini açıklayan{" "}
                <Link href="/kvkk#danisanlar" target="_blank" className="font-medium text-foreground underline underline-offset-2">
                  Aydınlatma Metni
                </Link>
                &apos;ni okudum.
              </span>
            </label>
            {e.kvkk && <p className="text-sm text-destructive-strong">{e.kvkk}</p>}
          </div>
        </fieldset>
      </div>

      {/* Stays in reach at the bottom of a phone screen; sits inline on larger screens. */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-2 border-t bg-canvas/90 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        {selected && plan && (
          <p className="mb-2 flex items-baseline justify-between gap-3 px-1 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">{selected.name}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {plan.installments > 1 ? `${plan.installments} × ${formatTRY(monthlyAmount(plan))}` : formatTRY(plan.total)}
            </span>
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={pending} disabled={!pkgId} data-umami-event="kayit-gonder">
          {pending ? "Gönderiliyor…" : "Başvuruyu gönder"}
        </Button>
      </div>
    </form>
  );
}

function StepLegend({ n, icon, children }: { n: number; icon?: ReactNode; children: ReactNode }) {
  return (
    <legend className="mb-4 flex items-center gap-2.5 text-base font-semibold">
      <span
        className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums"
        aria-hidden
      >
        {n}
      </span>
      {children}
      {icon}
    </legend>
  );
}

function SelectDot({ on, className }: { on: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full border border-input",
        on && "border-primary bg-primary text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      {on && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}
