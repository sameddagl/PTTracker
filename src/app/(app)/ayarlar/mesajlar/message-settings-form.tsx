"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { BellRing, MessagesSquare, PackageCheck, RotateCcw, Ruler } from "lucide-react";
import { toast } from "sonner";
import { Field, NativeSelect } from "@/components/field";
import { FormSubmit } from "@/components/form-submit";
import { Switch } from "@/components/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/forms";
import {
  REMINDER_HOUR_OPTIONS,
  TEMPLATES,
  TEMPLATE_MAX_LENGTH,
  TEMPLATE_VARS,
  fillTemplate,
  type TemplateKey,
  type TemplateVar,
} from "@/lib/templates";
import { saveMessageSettingsAction } from "./actions";

type Initial = { remindersEnabled: boolean; reminderHours: number; renewalOffersEnabled: boolean; texts: Record<TemplateKey, string> };

// What the preview under each box fills in.
const SAMPLE: Record<TemplateVar, string> = {
  ad: "Selin Aydın",
  zaman: "yarın 18:00",
  ders: "Reformer grup dersi",
  paket: "8 Ders Özel Reformer",
  kalan: "2",
  durum: "Paketinde 2 ders kaldı.",
  tarih: "12 Ekim",
  tutar: "₺4.000",
  link: "studyomapp.com/p/…",
};

const hoursLabel = (h: number) => (h === 24 ? "1 gün önce" : h === 48 ? "2 gün önce" : `${h} saat önce`);

const MANUAL = (Object.keys(TEMPLATES) as TemplateKey[]).filter((k) => !TEMPLATES[k].auto);

export function MessageSettingsForm({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<FormState<string>, FormData>(saveMessageSettingsAction, {});
  const [reminders, setReminders] = useState(initial.remindersEnabled);
  const [hours, setHours] = useState(initial.reminderHours);
  const [renewals, setRenewals] = useState(initial.renewalOffersEnabled);

  useEffect(() => {
    if (state.savedAt) toast.success("Kaydedildi");
  }, [state.savedAt]);

  return (
    <form action={action} className="flex flex-col gap-8" noValidate>
      <input type="hidden" name="remindersEnabled" value={reminders ? "on" : ""} />
      <input type="hidden" name="renewalOffersEnabled" value={renewals ? "on" : ""} />

      <section aria-labelledby="reminder-heading" className="flex flex-col gap-5 surface p-5">
        <SectionHead
          id="reminder-heading"
          icon={<BellRing />}
          title="Ders hatırlatması"
          text="Danışana dersinden önce “Geliyor musun?” bildirimi gider. Cevap butonları danışanın sayfasının en üstünde çıkar."
          on={reminders}
          onChange={setReminders}
        />
        {reminders && (
          <>
            <Field id="reminderHours" label="Ne zaman gitsin?" error={state.errors?.reminderHours}>
              <NativeSelect
                id="reminderHours"
                name="reminderHours"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="max-w-72"
              >
                {REMINDER_HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    Dersten {hoursLabel(h)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <TemplateField name="reminder" initial={initial.texts.reminder} error={state.errors?.reminder} />
          </>
        )}
        {/* Keep the hours in the form while the section is folded away. */}
        {!reminders && <input type="hidden" name="reminderHours" value={hours} />}
        {!reminders && <input type="hidden" name="reminder" value={initial.texts.reminder} />}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Hatırlatma sadece bildirim olarak gider, e-posta gitmez. Danışanın sayfasını telefonuna ekleyip bildirimlere izin vermiş olması gerekir.
          Bugün ekranındaki “Hatırlat” butonu da bu metni kullanır.
        </p>
      </section>

      <section aria-labelledby="renewal-heading" className="flex flex-col gap-5 surface p-5">
        <SectionHead
          id="renewal-heading"
          icon={<PackageCheck />}
          title="Paket yenileme teklifi"
          text="Paketinde 2 ders kalınca ya da bitişine bir hafta kalınca danışana bir kez bildirim gider; aynı paketi sayfasından yenileyebilir."
          on={renewals}
          onChange={setRenewals}
        />
        {renewals ? (
          <TemplateField name="renewal" initial={initial.texts.renewal} error={state.errors?.renewal} />
        ) : (
          <input type="hidden" name="renewal" value={initial.texts.renewal} />
        )}
      </section>

      <section aria-labelledby="measure-reminder-heading" className="flex flex-col gap-5 surface p-5">
        <div className="flex items-start gap-3">
          <SectionIcon>
            <Ruler />
          </SectionIcon>
          <div className="min-w-0">
            <h2 id="measure-reminder-heading" className="text-base font-semibold">
              Ölçüm hatırlatması
            </h2>
            <p className="text-sm text-muted-foreground">
              Danışanın Ölçümler sekmesinde sıklık seçersen (örneğin 4 haftada bir), zamanı gelince danışana bir kez bildirim gider.
            </p>
          </div>
        </div>
        <TemplateField name="measureReminder" initial={initial.texts.measureReminder} error={state.errors?.measureReminder} />
      </section>

      <section aria-labelledby="ready-heading" className="flex flex-col gap-5 surface p-5">
        <div className="flex items-start gap-3">
          <SectionIcon>
            <MessagesSquare />
          </SectionIcon>
          <div className="min-w-0">
            <h2 id="ready-heading" className="text-base font-semibold">
              Hazır mesajlar
            </h2>
            <p className="text-sm text-muted-foreground">
              Mesaj ya da WhatsApp butonuna basınca bu metinler hazır gelir. Göndermeden önce istediğin gibi değiştirebilirsin.
            </p>
          </div>
        </div>
        {MANUAL.map((k) => (
          <TemplateField key={k} name={k} initial={initial.texts[k]} error={state.errors?.[k]} />
        ))}
      </section>

      <FormSubmit loading={pending} className="sm:self-start">
        Kaydet
      </FormSubmit>
    </form>
  );
}

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted [&_svg]:size-5" aria-hidden>
      {children}
    </span>
  );
}

function SectionHead({
  id,
  icon,
  title,
  text,
  on,
  onChange,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <SectionIcon>{icon}</SectionIcon>
      <div className="min-w-0 flex-1">
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      <Switch on={on} label={`${title}: ${on ? "açık" : "kapalı"}`} onChange={onChange} />
    </div>
  );
}

function TemplateField({ name, initial, error }: { name: TemplateKey; initial: string; error?: string }) {
  const def = TEMPLATES[name];
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  function insert(v: TemplateVar) {
    const el = ref.current;
    const token = `{${v}}`;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + token + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  return (
    <Field id={`t-${name}`} label={def.auto ? "Bildirim metni" : def.label} hint={def.auto ? undefined : def.hint} error={error}>
      <div className="flex flex-col gap-2">
        <Textarea
          ref={ref}
          id={`t-${name}`}
          name={name}
          rows={3}
          maxLength={TEMPLATE_MAX_LENGTH}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={def.text}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {def.vars.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insert(v)}
              title={TEMPLATE_VARS[v]}
              aria-label={`{${v}} ekle: ${TEMPLATE_VARS[v]}`}
              className="min-h-8 rounded-full bg-secondary px-3 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {`{${v}}`}
            </button>
          ))}
          {text.trim() !== def.text && (
            <Button type="button" size="sm" variant="ghost" className="ml-auto text-muted-foreground" onClick={() => setText(def.text)}>
              <RotateCcw />
              Varsayılana dön
            </Button>
          )}
        </div>
        <p className="rounded-xl bg-muted px-3 py-2 text-sm whitespace-pre-line text-muted-foreground">
          <span className="sr-only">Örnek: </span>
          {fillTemplate(text.trim() || def.text, SAMPLE)}
        </p>
      </div>
    </Field>
  );
}
