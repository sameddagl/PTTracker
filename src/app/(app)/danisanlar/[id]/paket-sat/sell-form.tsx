"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Field, FormError, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAYMENT_METHOD_LABELS, SESSION_TYPE_LABELS, formatShortDate, formatTRY } from "@/lib/format";
import { parseTRY, type FormState } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { sellPackageAction, type SellField } from "./actions";

export type TemplateOption = {
  id: string;
  name: string;
  sessionType: keyof typeof SESSION_TYPE_LABELS;
  sessionCount: number;
  validityDays: number | null;
  price: string | null;
  makeupAllowance: number;
};

type Values = Record<"templateId" | "name" | "sessionType" | "totalSessions" | "validityDays" | "price" | "makeupAllowance", string>;

const fromTemplate = (t: TemplateOption): Values => ({
  templateId: t.id,
  name: t.name,
  sessionType: t.sessionType,
  totalSessions: String(t.sessionCount),
  validityDays: t.validityDays ? String(t.validityDays) : "",
  price: t.price ? String(Number(t.price)) : "",
  makeupAllowance: String(t.makeupAllowance),
});

const EMPTY: Values = {
  templateId: "",
  name: "",
  sessionType: "private",
  totalSessions: "8",
  validityDays: "35",
  price: "",
  makeupAllowance: "1",
};

function expiryPreview(startsOn: string, validityDays: string) {
  const days = Number(validityDays);
  if (!startsOn || !Number.isInteger(days) || days < 1) return null;
  const d = new Date(`${startsOn}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days - 1);
  return formatShortDate(d.toISOString().slice(0, 10));
}

export function SellForm({ clientId, templates, today }: { clientId: string; templates: TemplateOption[]; today: string }) {
  const [state, action, pending] = useActionState<FormState<SellField>, FormData>(sellPackageAction, {});
  const e = state.errors ?? {};
  const [values, setValues] = useState<Values>(() => (templates[0] ? fromTemplate(templates[0]) : EMPTY));
  const [startsOn, setStartsOn] = useState(today);
  const [paymentAmount, setPaymentAmount] = useState("");

  const set = (key: keyof Values) => (ev: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: ev.target.value }));

  const expiry = expiryPreview(startsOn, values.validityDays);
  const price = parseTRY(values.price);

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="templateId" value={values.templateId} />
      <FormError message={e.clientId ?? e.templateId} />

      {templates.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Şablon</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setValues(fromTemplate(t))}
                aria-pressed={values.templateId === t.id}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                  values.templateId === t.id && "border-primary bg-primary/10 hover:bg-primary/10",
                )}
              >
                <span className="text-sm font-medium">{t.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t.sessionCount} ders{t.price ? ` · ${formatTRY(t.price)}` : ""}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Sık sattığın paketleri{" "}
          <Link href="/ayarlar/paketler" className="font-medium text-foreground underline underline-offset-2">
            şablon olarak kaydedersen
          </Link>{" "}
          burada tek dokunuşla seçebilirsin.
        </p>
      )}

      <div className="flex flex-col gap-4">
        <Field id="name" label="Paket adı" error={e.name}>
          <Input id="name" name="name" value={values.name} onChange={set("name")} placeholder="Örn. 8 Ders Özel" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field id="sessionType" label="Ders türü" error={e.sessionType}>
            <NativeSelect id="sessionType" name="sessionType" value={values.sessionType} onChange={set("sessionType")}>
              {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="totalSessions" label="Ders sayısı" error={e.totalSessions}>
            <Input
              id="totalSessions"
              name="totalSessions"
              type="number"
              inputMode="numeric"
              min={1}
              value={values.totalSessions}
              onChange={set("totalSessions")}
            />
          </Field>
          <Field id="startsOn" label="Başlangıç" error={e.startsOn}>
            <Input id="startsOn" name="startsOn" type="date" value={startsOn} onChange={(ev) => setStartsOn(ev.target.value)} />
          </Field>
          <Field id="validityDays" label="Geçerlilik (gün)" error={e.validityDays}>
            <Input
              id="validityDays"
              name="validityDays"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="süresiz"
              value={values.validityDays}
              onChange={set("validityDays")}
            />
          </Field>
          <Field id="price" label="Fiyat (₺)" error={e.price}>
            <Input id="price" name="price" inputMode="decimal" placeholder="4.000" value={values.price} onChange={set("price")} />
          </Field>
          <Field id="makeupAllowance" label="Telafi hakkı" error={e.makeupAllowance}>
            <Input
              id="makeupAllowance"
              name="makeupAllowance"
              type="number"
              inputMode="numeric"
              min={0}
              value={values.makeupAllowance}
              onChange={set("makeupAllowance")}
            />
          </Field>
        </div>
        <p className="text-sm text-muted-foreground">
          {expiry ? (
            <>
              Son kullanım: <span className="font-medium text-foreground">{expiry}</span>
            </>
          ) : (
            "Süresiz paket"
          )}
        </p>
      </div>

      <fieldset className="flex flex-col gap-4 rounded-xl border p-4">
        <legend className="px-1 text-sm font-medium">Ödeme (isteğe bağlı)</legend>
        <div className="grid grid-cols-2 gap-4">
          <Field id="paymentAmount" label="Alınan tutar (₺)" error={e.paymentAmount}>
            <Input
              id="paymentAmount"
              name="paymentAmount"
              inputMode="decimal"
              placeholder="0"
              value={paymentAmount}
              onChange={(ev) => setPaymentAmount(ev.target.value)}
            />
          </Field>
          <Field id="paymentMethod" label="Yöntem">
            <NativeSelect id="paymentMethod" name="paymentMethod" defaultValue="bank_transfer">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        {price !== null && Number.isFinite(price) && price > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setPaymentAmount(values.price)}
          >
            Tamamı ödendi ({formatTRY(price)})
          </Button>
        )}
      </fieldset>

      <Button type="submit" size="lg" disabled={pending} className="sm:self-start">
        {pending ? "Kaydediliyor…" : "Paketi sat"}
      </Button>
    </form>
  );
}
