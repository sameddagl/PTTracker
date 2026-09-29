"use client";

import { useActionState, useState } from "react";
import { Field, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAYMENT_METHOD_LABELS, formatShortDate, formatTRY } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { submitWithoutReset } from "@/lib/use-form-submit";
import { recordPaymentAction, type PaymentField } from "../actions";

export type PayablePackage = { id: string; clientId: string; name: string; startsOn: string; due: string };

/** Amount as the trainer would type it: "2500" or "2500,50". */
const asInput = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ","));

export function PaymentForm({
  clients,
  packages,
  initialClientId,
  initialPackageId,
  today,
  next,
}: {
  clients: { id: string; fullName: string }[];
  packages: PayablePackage[];
  initialClientId: string;
  initialPackageId: string;
  today: string;
  next: string;
}) {
  const [state, action, pending] = useActionState<FormState<PaymentField>, FormData>(recordPaymentAction, {});
  const e = state.errors ?? {};
  const v = state.values;

  const [clientId, setClientId] = useState(v?.clientId ?? initialClientId);
  const clientPackages = packages.filter((p) => p.clientId === clientId);
  // Default to the package the link pointed at, else the oldest one with debt.
  const defaultPackage = (cid: string, preferred?: string) => {
    const own = packages.filter((p) => p.clientId === cid);
    return (
      own.find((p) => p.id === preferred)?.id ??
      [...own].reverse().find((p) => Number(p.due) > 0)?.id ??
      ""
    );
  };
  const [packageId, setPackageId] = useState(v?.clientPackageId ?? defaultPackage(initialClientId, initialPackageId));
  const selected = clientPackages.find((p) => p.id === packageId);
  const [amount, setAmount] = useState(v?.amount ?? (selected && Number(selected.due) > 0 ? asInput(Number(selected.due)) : ""));

  function changeClient(id: string) {
    setClientId(id);
    const pkg = defaultPackage(id);
    setPackageId(pkg);
    const due = Number(packages.find((p) => p.id === pkg)?.due ?? 0);
    setAmount(due > 0 ? asInput(due) : "");
  }

  function changePackage(id: string) {
    setPackageId(id);
    const due = Number(packages.find((p) => p.id === id)?.due ?? 0);
    if (due > 0) setAmount(asInput(due));
  }

  return (
    <form onSubmit={submitWithoutReset(action)} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />

      <Field id="clientId" label="Danışan" error={e.clientId}>
        <NativeSelect id="clientId" name="clientId" value={clientId} onChange={(ev) => changeClient(ev.target.value)}>
          <option value="" disabled>
            Seç
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field id="clientPackageId" label="Paket" error={e.clientPackageId}>
        <NativeSelect
          id="clientPackageId"
          name="clientPackageId"
          value={packageId}
          onChange={(ev) => changePackage(ev.target.value)}
          disabled={!clientId}
        >
          <option value="">Pakete bağlı değil (tek ders vb.)</option>
          {clientPackages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {formatShortDate(p.startsOn)}
              {Number(p.due) > 0 ? ` · ${formatTRY(p.due)} borç` : " · ödendi"}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="amount" label="Tutar (₺)" error={e.amount}>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(ev) => setAmount(ev.target.value)}
            aria-invalid={!!e.amount || undefined}
          />
        </Field>
        <Field id="paidOn" label="Tarih" error={e.paidOn}>
          <Input id="paidOn" name="paidOn" type="date" max={today} defaultValue={v?.paidOn ?? today} />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Yöntem</legend>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
            <label
              key={value}
              className="flex h-11 cursor-pointer items-center justify-center rounded-lg border text-xs font-medium transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring sm:text-sm"
            >
              <input
                type="radio"
                name="method"
                value={value}
                defaultChecked={(v?.method ?? "bank_transfer") === value}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field id="note" label="Not" hint="isteğe bağlı">
        <Input id="note" name="note" defaultValue={v?.note} placeholder="Örn. 2. taksit" />
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="sm:self-start">
        {pending ? "Kaydediliyor…" : "Ödemeyi kaydet"}
      </Button>
    </form>
  );
}
