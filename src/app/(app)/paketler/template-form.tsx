"use client";

import { useActionState, useRef, useState } from "react";
import { Field, FormError, NativeSelect } from "@/components/field";
import { PriceTag } from "@/components/price-tag";
import { FormSubmit } from "@/components/form-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SESSION_TYPE_LABELS, formatTRY } from "@/lib/format";
import { parseTRY, type FormState } from "@/lib/forms";
import { INSTALLMENT_OPTIONS } from "@/lib/installments";
import { discountPercent } from "@/lib/pricing";
import { submitWithoutReset } from "@/lib/use-form-submit";
import { saveTemplateAction, type TemplateField } from "./actions";

// One tap fills the common Turkish package shapes.
const PRESETS = [
  { name: "8 Ders Özel", sessionType: "private", sessionCount: 8, validityDays: 35, makeupAllowance: 1 },
  { name: "12 Ders Özel", sessionType: "private", sessionCount: 12, validityDays: 49, makeupAllowance: 2 },
  { name: "8 Ders Düet", sessionType: "duet", sessionCount: 8, validityDays: 35, makeupAllowance: 1 },
  { name: "10 Ders Grup", sessionType: "group", sessionCount: 10, validityDays: 60, makeupAllowance: 1 },
] as const;

// Turkish amounts ("4.000", "2.500,50 ₺"); parseTRY on the server has the final say.
const MONEY_PATTERN = "[0-9.,₺\\s]+";
const MONEY_MESSAGE = "Tutarı rakamla yaz, örn. 4.000";

const PLAN_COUNTS = INSTALLMENT_OPTIONS.filter((n) => n > 1);

type Flag = "isPublic" | "isTrial";
export type TemplateValues = Record<Exclude<TemplateField, Flag>, string> & Record<Flag, boolean>;

export const EMPTY_TEMPLATE: TemplateValues = {
  name: "",
  sessionType: "private",
  sessionCount: "8",
  validityDays: "35",
  price: "",
  compareAtPrice: "",
  installmentPrice: "",
  installments: "1",
  makeupAllowance: "1",
  isPublic: true,
  isTrial: false,
  description: "",
  features: "",
};

const amount = (v: string) => {
  const n = parseTRY(v);
  return n !== null && Number.isFinite(n) && n > 0 ? n : null;
};

export function TemplateForm({
  id,
  initial = EMPTY_TEMPLATE,
  instructors = [],
  instructorIds = [],
}: {
  id?: string;
  initial?: TemplateValues;
  /** Studios: the team, to limit the package to some instructors. */
  instructors?: { id: string; name: string }[];
  instructorIds?: string[];
}) {
  const [state, action, pending] = useActionState<FormState<TemplateField>, FormData>(saveTemplateAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const v = state.values ?? {};
  const e = state.errors ?? {};
  const val = (k: Exclude<TemplateField, Flag>) => v[k] ?? initial[k];

  const [price, setPrice] = useState(initial.price);
  const [compareAt, setCompareAt] = useState(initial.compareAtPrice);
  const [hasPlan, setHasPlan] = useState(Number(initial.installments) > 1);
  const [count, setCount] = useState(Number(initial.installments) > 1 ? initial.installments : "3");
  const [planPrice, setPlanPrice] = useState(initial.installmentPrice);

  const cash = amount(price);
  const was = amount(compareAt);
  const pct = discountPercent(was, cash);
  const planTotal = amount(planPrice);
  // The struck-through price needs a cash price to compare against.
  const needsPrice = compareAt.trim() !== "" && price.trim() === "";

  function applyPreset(p: (typeof PRESETS)[number]) {
    const form = formRef.current;
    if (!form) return;
    for (const [key, value] of Object.entries(p)) {
      const el = form.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | null;
      if (!el) continue;
      el.value = String(value);
      // Let the submit button re-check the form.
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    (form.elements.namedItem("price") as HTMLInputElement | null)?.focus();
  }

  return (
    <form ref={formRef} onSubmit={submitWithoutReset(action)} className="flex flex-col gap-6" noValidate>
      {id && <input type="hidden" name="id" value={id} />}
      <FormError message={Object.keys(e).length > 0 ? "Bazı alanları kontrol et." : undefined} />
      {!id && (
        <div className="flex flex-wrap gap-2" aria-label="Hazır paketler">
          {PRESETS.map((p) => (
            <Button key={p.name} type="button" variant="outline" size="sm" onClick={() => applyPreset(p)}>
              {p.name}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Field id="name" label="Paket adı" error={e.name}>
          <Input
            id="name"
            name="name"
            placeholder="Örn. 8 Ders Özel Reformer"
            defaultValue={val("name")}
            required
            minLength={2}
            maxLength={80}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field id="sessionType" label="Ders türü" error={e.sessionType}>
            <NativeSelect id="sessionType" name="sessionType" required defaultValue={val("sessionType")}>
              {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="sessionCount" label="Ders sayısı" error={e.sessionCount}>
            <Input
              id="sessionCount"
              name="sessionCount"
              type="number"
              inputMode="numeric"
              required
              min={1}
              max={200}
              step={1}
              defaultValue={val("sessionCount")}
            />
          </Field>
          <Field id="validityDays" label="Geçerlilik (gün)" error={e.validityDays}>
            <Input
              id="validityDays"
              name="validityDays"
              type="number"
              inputMode="numeric"
              min={1}
              max={730}
              step={1}
              placeholder="süresiz"
              defaultValue={val("validityDays")}
            />
          </Field>
          <Field id="makeupAllowance" label="Telafi hakkı" error={e.makeupAllowance}>
            <Input
              id="makeupAllowance"
              name="makeupAllowance"
              type="number"
              inputMode="numeric"
              min={0}
              max={50}
              step={1}
              defaultValue={val("makeupAllowance")}
            />
          </Field>
        </div>
        <p className="text-sm text-muted-foreground">Telafi hakkı: geç iptalde paketten düşmeyen ders sayısı.</p>
      </div>

      <fieldset className="flex flex-col gap-4 surface p-4">
        <legend className="px-1 text-sm font-medium">Fiyat</legend>
        <div className="grid grid-cols-2 gap-4">
          <Field id="price" label="Peşin fiyat (₺)" error={e.price}>
            <Input
              id="price"
              name="price"
              inputMode="decimal"
              required={needsPrice}
              pattern={MONEY_PATTERN}
              data-invalid-message={MONEY_MESSAGE}
              data-missing-message="İndirimsiz fiyat için peşin fiyatı da gir."
              placeholder="4.000"
              value={price}
              onChange={(ev) => setPrice(ev.target.value)}
            />
          </Field>
          <Field id="compareAtPrice" label="İndirimsiz fiyat (₺)" hint="isteğe bağlı" error={e.compareAtPrice}>
            <Input
              id="compareAtPrice"
              name="compareAtPrice"
              inputMode="decimal"
              pattern={MONEY_PATTERN}
              data-invalid-message={MONEY_MESSAGE}
              placeholder="5.000"
              value={compareAt}
              onChange={(ev) => setCompareAt(ev.target.value)}
            />
          </Field>
        </div>
        {was !== null && cash !== null && was <= cash && !e.compareAtPrice && (
          <p className="text-sm text-destructive-strong">İndirimsiz fiyat peşin fiyattan yüksek olmalı.</p>
        )}
        {cash !== null && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            Sayfanda böyle görünür:
            <PriceTag price={cash} compareAtPrice={pct !== null ? was : null} align="start" />
          </p>
        )}

        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={hasPlan}
            onChange={(ev) => setHasPlan(ev.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Taksit seçeneği de ekle
        </label>
        <input type="hidden" name="installments" value={hasPlan ? count : "1"} />
        {hasPlan ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field id="installmentsCount" label="Taksit sayısı">
                <NativeSelect id="installmentsCount" value={count} onChange={(ev) => setCount(ev.target.value)}>
                  {PLAN_COUNTS.map((n) => (
                    <option key={n} value={n}>
                      {n} taksit
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field id="installmentPrice" label="Taksitli toplam (₺)" error={e.installmentPrice}>
                <Input
                  id="installmentPrice"
                  name="installmentPrice"
                  inputMode="decimal"
                  required
                  pattern={MONEY_PATTERN}
                  data-invalid-message={MONEY_MESSAGE}
                  data-missing-message="Taksitli toplam fiyatı gir."
                  placeholder={cash ? String(Math.round(cash * 1.1)) : "4.400"}
                  value={planPrice}
                  onChange={(ev) => setPlanPrice(ev.target.value)}
                />
              </Field>
            </div>
            {planTotal !== null && (
              <p className="text-sm text-muted-foreground tabular-nums">
                30 gün arayla {count} × {formatTRY(Math.floor(planTotal / Number(count)))} ≈ {formatTRY(planTotal)}
                {cash !== null && planTotal > cash && ` · peşin fiyattan ${formatTRY(planTotal - cash)} fazla`}
              </p>
            )}
          </>
        ) : (
          <input type="hidden" name="installmentPrice" value="" />
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-4 surface p-4">
        <legend className="px-1 text-sm font-medium">Sayfanda nasıl görünsün</legend>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={v.isPublic !== undefined ? v.isPublic === "on" : initial.isPublic}
            className="size-4 accent-[var(--primary)]"
          />
          Sayfanda göster
        </label>
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="isTrial"
            defaultChecked={v.isTrial !== undefined ? v.isTrial === "on" : initial.isTrial}
            className="mt-0.5 size-4 accent-[var(--primary)]"
          />
          <span>
            Deneme dersi
            <span className="block text-xs text-muted-foreground">
              Sayfanda en üstte durur. Herkes bir kez alabilir; şu anki danışanların görmez.
            </span>
          </span>
        </label>
        <Field id="description" label="Açıklama" hint="isteğe bağlı" error={e.description}>
          <Textarea
            id="description"
            name="description"
            rows={2}
            maxLength={500}
            placeholder="Örn. Birebir reformer dersleri, kişiye özel program."
            defaultValue={val("description")}
          />
        </Field>
        <Field id="features" label="Paketin içeriği" hint="her satıra bir madde" error={e.features}>
          <Textarea
            id="features"
            name="features"
            rows={3}
            placeholder={"Haftada 2 ders\nİlk derste postür analizi\nWhatsApp'tan destek"}
            defaultValue={val("features")}
          />
        </Field>
      </fieldset>

      {instructors.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Hangi eğitmenlerle?</legend>
          <p className="text-xs text-muted-foreground">Hiçbirini seçmezsen paket bütün eğitmenlerin derslerinde kullanılır.</p>
          <div className="flex flex-wrap gap-2">
            {instructors.map((i) => (
              <label key={i.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border bg-card px-4 text-sm has-[:checked]:border-foreground has-[:checked]:bg-muted/60">
                <input type="checkbox" name="instructorIds" value={i.id} defaultChecked={instructorIds.includes(i.id)} className="size-4 accent-foreground" />
                {i.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <FormSubmit size="lg" loading={pending} className="sm:self-start">
        {id ? "Değişiklikleri kaydet" : "Paketi ekle"}
      </FormSubmit>
    </form>
  );
}
