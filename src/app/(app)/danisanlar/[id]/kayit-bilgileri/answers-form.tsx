"use client";

import { useActionState, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { FormError } from "@/components/field";
import { IntakeInput } from "@/components/intake-input";
import { Button } from "@/components/ui/button";
import { answerName, type IntakeFieldDef } from "@/lib/intake";
import { submitWithoutReset } from "@/lib/use-form-submit";
import { saveAnswersAction, type AnswersState } from "./actions";

type Field = IntakeFieldDef & { id: string; current: string[] };

export function AnswersForm({ clientId, fields, hasConsent }: { clientId: string; fields: Field[]; hasConsent: boolean }) {
  const [state, action, pending] = useActionState<AnswersState, FormData>(saveAnswersAction.bind(null, clientId), {});
  const [consent, setConsent] = useState(false);
  const e = state.errors ?? {};
  const general = fields.filter((f) => !f.isHealth);
  const health = fields.filter((f) => f.isHealth);
  const healthOpen = hasConsent || consent;

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-6" noValidate>
      <FormError message={e.form ?? (Object.keys(e).length > 0 ? "Formda hatalı alanlar var." : undefined)} />

      {general.length > 0 && (
        <section className="flex flex-col gap-5 surface p-5">
          {general.map((f) => (
            <IntakeInput key={f.id} field={{ ...f, required: false }} defaultValues={f.current} error={e[answerName(f.id)]} />
          ))}
        </section>
      )}

      {health.length > 0 && (
        <section aria-labelledby="health-heading" className="flex flex-col gap-5 surface p-5">
          <h2 id="health-heading" className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="size-4" aria-hidden />
            Sağlık bilgileri
          </h2>
          {hasConsent ? (
            <p className="-mt-3 text-sm text-muted-foreground">Danışanın sağlık verisi için açık rızası kayıtlı.</p>
          ) : (
            <label className="-mt-2 flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm">
              <input
                type="checkbox"
                name="healthConsent"
                checked={consent}
                onChange={(ev) => setConsent(ev.target.checked)}
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />
              <span className="text-muted-foreground">
                Danışan, sağlık verilerinin antrenman planlaması amacıyla işlenmesine KVKK kapsamında{" "}
                <strong className="font-medium text-foreground">açık rıza</strong> verdi.
              </span>
            </label>
          )}
          {health.map((f) => (
            <IntakeInput
              key={f.id}
              field={{ ...f, required: false }}
              defaultValues={f.current}
              disabled={!healthOpen}
              error={e[answerName(f.id)]}
            />
          ))}
        </section>
      )}

      <Button type="submit" size="lg" loading={pending} className="sm:self-start">
        Kaydet
      </Button>
    </form>
  );
}
