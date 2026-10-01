"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { NativeSelect } from "@/components/field";
import { Switch } from "@/components/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addCustomMetricAction, archiveCustomMetricAction, saveMetricSetAction, setSelfWeighAction } from "./actions";

type Item = { key: string; label: string; unit: string; custom: boolean };

export function MetricSettings({ catalog, selected: initial, selfWeigh: initialSelf }: { catalog: Item[]; selected: string[]; selfWeigh: boolean }) {
  const [selected, setSelected] = useState(initial);
  const [selfWeigh, setSelfWeigh] = useState(initialSelf);
  const [pending, start] = useTransition();
  const [adding, startAdd] = useTransition();
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState("");
  const [decimals, setDecimals] = useState(1);
  const { confirm, dialog } = useConfirm();
  const byKey = new Map(catalog.map((m) => [m.key, m]));
  const onForm = selected.map((k) => byKey.get(k)).filter((m): m is Item => Boolean(m));
  const offForm = catalog.filter((m) => !selected.includes(m.key));

  function saveSet(next: string[]) {
    const before = selected;
    setSelected(next);
    start(async () => {
      const res = await saveMetricSetAction(next);
      if (!res.ok) {
        setSelected(before);
        toast.error(res.error);
      }
    });
  }

  async function remove(m: Item) {
    if (m.custom) {
      const ok = await confirm({
        title: `“${m.label}” silinsin mi?`,
        body: "Formdan ve listeden çıkar. Daha önce girilen değerler grafiklerde kalır.",
        confirmLabel: "Sil",
        destructive: true,
      });
      if (!ok) return;
      start(async () => {
        const res = await archiveCustomMetricAction(m.key);
        if (!res.ok) toast.error(res.error);
        else setSelected((s) => s.filter((k) => k !== m.key));
      });
      return;
    }
    saveSet(selected.filter((k) => k !== m.key));
  }

  return (
    <div className="flex flex-col gap-8">
      {dialog}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="mb-3 text-base font-semibold">
          Formdaki ölçüler
        </h2>
        {onForm.length === 0 ? (
          <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">Formda ölçü yok. Aşağıdan ekle.</p>
        ) : (
          <ul className="divide-y overflow-hidden surface">
            {onForm.map((m) => (
              <li key={m.key} className="flex min-h-12 items-center gap-3 py-1 pr-2 pl-4 text-sm">
                <span className="flex-1 font-medium">{m.label}</span>
                {m.unit && <span className="text-muted-foreground">{m.unit}</span>}
                <Button type="button" size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label={`${m.label} ölçüsünü kaldır`} disabled={pending} onClick={() => remove(m)}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Kaldırdığın ölçünün eski değerleri danışanın grafiklerinde kalır.</p>
      </section>

      <section aria-labelledby="add-heading" className="flex flex-col gap-3">
        <h2 id="add-heading" className="text-base font-semibold">
          Ölçü ekle
        </h2>
        {offForm.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Eklenebilecek ölçüler">
            {offForm.map((m) => (
              <li key={m.key}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => saveSet([...selected, m.key])}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-card px-4 text-sm font-medium shadow-card hover:bg-muted/60 disabled:opacity-60"
                >
                  <Plus className="size-4" aria-hidden />
                  {m.label}
                </button>
              </li>
            ))}
          </ul>
        )}
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
            Kendi ölçün
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
          <p className="text-sm text-muted-foreground">Danışan sayfasındaki İlerlemem sekmesinden kilosunu yazar; grafikte “kendisi” diye görünür.</p>
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
