"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SESSION_TYPE_LABELS } from "@/lib/format";
import { INSTALLMENT_OPTIONS, installmentLabel } from "@/lib/installments";
import type { FormState } from "@/lib/forms";
import { saveTemplateAction, type TemplateField } from "./actions";

// One tap fills the common Turkish package shapes.
const PRESETS = [
  { name: "8 Ders Özel", sessionType: "private", sessionCount: 8, validityDays: 35, makeupAllowance: 1 },
  { name: "12 Ders Özel", sessionType: "private", sessionCount: 12, validityDays: 49, makeupAllowance: 2 },
  { name: "8 Ders Düet", sessionType: "duet", sessionCount: 8, validityDays: 35, makeupAllowance: 1 },
  { name: "10 Ders Grup", sessionType: "group", sessionCount: 10, validityDays: 60, makeupAllowance: 1 },
] as const;

export type TemplateValues = Record<Exclude<TemplateField, "isPublic">, string> & { isPublic: boolean };

const EMPTY: TemplateValues = {
  name: "",
  sessionType: "private",
  sessionCount: "8",
  validityDays: "35",
  price: "",
  makeupAllowance: "1",
  isPublic: true,
  description: "",
  features: "",
  sortOrder: "",
  installments: "1",
};

export function TemplateForm({ id, initial = EMPTY }: { id?: string; initial?: TemplateValues }) {
  const [state, action, pending] = useActionState<FormState<TemplateField>, FormData>(saveTemplateAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const v = state.values ?? {};
  const e = state.errors ?? {};
  const val = (k: Exclude<TemplateField, "isPublic">) => v[k] ?? initial[k];

  useEffect(() => {
    if (!state.savedAt) return;
    toast.success(id ? "Şablon güncellendi" : "Paket şablonu eklendi");
    if (id) router.push("/ayarlar/paketler");
  }, [state.savedAt, id, router]);

  function applyPreset(p: (typeof PRESETS)[number]) {
    const form = formRef.current;
    if (!form) return;
    for (const [key, value] of Object.entries(p)) {
      const el = form.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | null;
      if (el) el.value = String(value);
    }
    (form.elements.namedItem("price") as HTMLInputElement | null)?.focus();
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4" noValidate>
      {id && <input type="hidden" name="id" value={id} />}
      {!id && (
        <div className="flex flex-wrap gap-2" aria-label="Hazır şablonlar">
          {PRESETS.map((p) => (
            <Button key={p.name} type="button" variant="outline" size="sm" onClick={() => applyPreset(p)}>
              {p.name}
            </Button>
          ))}
        </div>
      )}

      <Field id="name" label="Paket adı" error={e.name}>
        <Input id="name" name="name" placeholder="Örn. 8 Ders Özel Reformer" defaultValue={val("name")} required />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="sessionType" label="Ders türü" error={e.sessionType}>
          <NativeSelect id="sessionType" name="sessionType" defaultValue={val("sessionType")}>
            {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="sessionCount" label="Ders sayısı" error={e.sessionCount}>
          <Input id="sessionCount" name="sessionCount" type="number" inputMode="numeric" min={1} defaultValue={val("sessionCount")} />
        </Field>
        <Field id="price" label="Fiyat (₺)" error={e.price}>
          <Input id="price" name="price" inputMode="decimal" placeholder="4.000" defaultValue={val("price")} />
        </Field>
        <Field id="validityDays" label="Geçerlilik (gün)" error={e.validityDays}>
          <Input
            id="validityDays"
            name="validityDays"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="süresiz"
            defaultValue={val("validityDays")}
          />
        </Field>
      </div>

      <Field id="installments" label="Ödeme" hint="taksitler 30 gün arayla, ilki paket başlangıcında" error={e.installments}>
        <NativeSelect id="installments" name="installments" defaultValue={val("installments")} className="max-w-48">
          {INSTALLMENT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {installmentLabel(n)}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field id="makeupAllowance" label="Telafi hakkı" hint="geç iptalde yanmayan ders sayısı" error={e.makeupAllowance}>
        <Input
          id="makeupAllowance"
          name="makeupAllowance"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={val("makeupAllowance")}
          className="max-w-24"
        />
      </Field>

      <fieldset className="flex flex-col gap-4 rounded-xl border p-4">
        <legend className="px-1 text-sm font-medium">Sayfanda nasıl görünsün</legend>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={v.isPublic !== undefined ? v.isPublic === "on" : initial.isPublic}
            className="size-4 accent-[var(--primary)]"
          />
          Herkese açık sayfamda göster
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
        <Field id="sortOrder" label="Sıra" hint="küçük sayı önce" error={e.sortOrder}>
          <Input id="sortOrder" name="sortOrder" type="number" inputMode="numeric" min={0} defaultValue={val("sortOrder")} className="max-w-24" />
        </Field>
      </fieldset>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Kaydediliyor…" : id ? "Değişiklikleri kaydet" : "Şablonu ekle"}
      </Button>
    </form>
  );
}
