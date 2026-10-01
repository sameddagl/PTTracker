"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { NativeSelect } from "@/components/field";
import { Switch } from "@/components/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addCustomMetricAction, archiveCustomMetricAction, saveMetricSetAction, setSelfWeighAction } from "./actions";

type Item = { key: string; label: string; unit: string };

export function MetricSettings({ builtin, custom, selected: initial, selfWeigh: initialSelf }: { builtin: Item[]; custom: Item[]; selected: string[]; selfWeigh: boolean }) {
  const [selected, setSelected] = useState(initial);
  const [selfWeigh, setSelfWeigh] = useState(initialSelf);
  const [pending, start] = useTransition();
  const [adding, startAdd] = useTransition();
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState("");
  const [decimals, setDecimals] = useState(1);
  const { confirm, dialog } = useConfirm();

  function toggle(key: string) {
    const before = selected;
    const next = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
    if (next.length === 0) return void toast("En az bir ölçü seçili kalmalı.");
    setSelected(next);
    start(async () => {
      const res = await saveMetricSetAction(next);
      if (!res.ok) {
        setSelected(before);
        toast.error(res.error);
      }
    });
  }

  const row = (m: Item, removable = false) => {
    const on = selected.includes(m.key);
    return (
      <li key={m.key} className="flex items-center gap-2 pr-2">
        <button
          type="button"
          onClick={() => toggle(m.key)}
          aria-pressed={on}
          disabled={pending}
          className="flex min-h-12 flex-1 items-center gap-3 px-4 text-left text-sm outline-none focus-visible:bg-muted/60"
        >
          <span
            className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border", on ? "border-primary bg-primary text-primary-foreground" : "bg-card")}
            aria-hidden
          >
            {on && <Check className="size-3.5" strokeWidth={3} />}
          </span>
          <span className="flex-1 font-medium">{m.label}</span>
          {m.unit && <span className="text-muted-foreground">{m.unit}</span>}
        </button>
        {removable && (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="text-muted-foreground"
            aria-label={`${m.label} ölçüsünü kaldır`}
            onClick={async () => {
              const ok = await confirm({
                title: `“${m.label}” kaldırılsın mı?`,
                body: "Formlardan çıkar. Daha önce girilen değerler grafiklerde kalır.",
                confirmLabel: "Kaldır",
                destructive: true,
              });
              if (!ok) return;
              start(async () => {
                const res = await archiveCustomMetricAction(m.key);
                if (!res.ok) toast.error(res.error);
                else setSelected((s) => s.filter((k) => k !== m.key));
              });
            }}
          >
            <Trash2 />
          </Button>
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {dialog}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="mb-3 text-base font-semibold">
          Formdaki ölçüler
        </h2>
        <ul className="divide-y overflow-hidden surface">{builtin.map((m) => row(m))}</ul>
      </section>

      <section aria-labelledby="custom-heading">
        <h2 id="custom-heading" className="mb-1 text-base font-semibold">
          Kendi ölçülerin
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">Örneğin plank süresi, squat ağırlığı ya da omuz esnekliği.</p>
        {custom.length > 0 && <ul className="mb-3 divide-y overflow-hidden surface">{custom.map((m) => row(m, true))}</ul>}
        <form
          className="flex flex-col gap-3 surface p-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            startAdd(async () => {
              const res = await addCustomMetricAction({ label, unit, decimals });
              if (!res.ok) return void toast.error(res.error);
              toast.success(`“${label.trim()}” eklendi`);
              setLabel("");
              setUnit("");
            });
          }}
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium">
            Ölçünün adı
            <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} placeholder="Plank süresi" required />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <label className="flex flex-col gap-1.5 text-sm font-medium sm:w-28">
              Birim
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={12} placeholder="sn" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium sm:w-32">
              Ondalık
              <NativeSelect value={decimals} onChange={(e) => setDecimals(Number(e.target.value))}>
                <option value={0}>Tam sayı</option>
                <option value={1}>1 hane</option>
                <option value={2}>2 hane</option>
              </NativeSelect>
            </label>
          </div>
          <Button type="submit" loading={adding} disabled={!label.trim()}>
            <Plus />
            Ekle
          </Button>
        </form>
      </section>

      <section aria-labelledby="self-heading" className="flex items-start gap-3 surface p-4">
        <div className="min-w-0 flex-1">
          <h2 id="self-heading" className="text-base font-semibold">
            Danışan kendi kilosunu girebilsin
          </h2>
          <p className="text-sm text-muted-foreground">
            Danışan sayfasındaki İlerlemem sekmesinden kilosunu yazar; grafikte “kendisi” diye görünür.
          </p>
        </div>
        <Switch
          on={selfWeigh}
          label="Danışan kendi kilosunu girebilsin"
          disabled={pending}
          onChange={(v) => {
            setSelfWeigh(v);
            start(async () => {
              const res = await setSelfWeighAction(v);
              if (!res.ok) {
                setSelfWeigh(!v);
                toast.error(res.error);
              }
            });
          }}
        />
      </section>
    </div>
  );
}
