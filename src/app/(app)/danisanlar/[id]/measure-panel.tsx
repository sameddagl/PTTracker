"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Settings2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { ProgressView } from "@/components/progress-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MetricDef, Series } from "@/lib/measurements";
import { formatMetric } from "@/lib/measurements";
import { cn } from "@/lib/utils";
import { NativeSelect } from "@/components/field";
import { MEASURE_EVERY_OPTIONS } from "@/lib/templates";
import { deleteMeasurementDayAction, saveMeasurementsAction, setMeasureIntervalAction } from "./progress-actions";

export type MeasureDay = { date: string; label: string; items: { metric: MetricDef; value: number; byClient: boolean }[] };

export function MeasurePanel({
  clientId,
  firstName,
  consented,
  metrics,
  series,
  days,
  today,
  archived,
  every,
}: {
  clientId: string;
  firstName: string;
  consented: boolean;
  metrics: MetricDef[];
  series: Series[];
  days: MeasureDay[];
  today: string;
  archived: boolean;
  /** Reminder interval in days, null when off. */
  every: number | null;
}) {
  const [open, setOpen] = useState(series.length === 0);
  const [date, setDate] = useState(today);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  // Health data: the first entry records the client's consent (once), unless they gave it at sign-up or on their page.
  const [attest, setAttest] = useState(false);
  const [saving, startSave] = useTransition();
  const [pending, start] = useTransition();
  const { confirm, dialog } = useConfirm();
  const last = new Map(series.map((s) => [s.metric.key, s.points[s.points.length - 1].value]));

  function save() {
    setError(null);
    startSave(async () => {
      const res = await saveMeasurementsAction(clientId, date, values, !consented && attest);
      if (!res.ok) return setError({ text: res.error, field: res.field });
      toast.success(res.saved === 1 ? "Ölçüm kaydedildi" : `${res.saved} ölçü kaydedildi`);
      setValues({});
      setOpen(false);
    });
  }

  async function removeDay(d: MeasureDay) {
    if (!(await confirm({ title: `${d.label} ölçümleri silinsin mi?`, confirmLabel: "Sil", destructive: true }))) return;
    start(async () => {
      const res = await deleteMeasurementDayAction(clientId, d.date);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {dialog}
      {!archived &&
        (open ? (
          <section aria-labelledby="add-measure-heading" className="flex flex-col gap-4 surface p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="add-measure-heading" className="text-base font-semibold">
                Ölçüm ekle
              </h2>
              {series.length > 0 && (
                <Button type="button" size="icon-sm" variant="ghost" aria-label="Kapat" onClick={() => setOpen(false)}>
                  <X />
                </Button>
              )}
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Tarih
              <Input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="max-w-48" aria-invalid={error?.field === "date"} />
            </label>
            {metrics.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Formda ölçü yok.{" "}
                <Link href="/ayarlar/olcumler" className="underline underline-offset-4">
                  Ölçü ekle
                </Link>
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {metrics.map((m) => (
                <label key={m.key} className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
                  <span className="truncate">{m.label}</span>
                  <span className="relative">
                    <Input
                      inputMode="decimal"
                      value={values[m.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))}
                      placeholder={last.has(m.key) ? formatMetric(last.get(m.key)!, { ...m, unit: "" }) : ""}
                      aria-invalid={error?.field === m.key}
                      className={cn(m.unit && "pr-14")}
                    />
                    {m.unit && (
                      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">{m.unit}</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
            {!consented && (
              <label className="flex items-start gap-3 rounded-xl bg-muted/60 p-3 text-sm">
                <input type="checkbox" checked={attest} onChange={(e) => setAttest(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]" />
                <span>
                  <span className="font-medium">Danışanın açık rızasını aldım.</span>{" "}
                  <span className="text-muted-foreground">
                    Ölçümler sağlık verisi sayılır; bu bir kez sorulur. Danışan onayı kendi sayfasındaki İlerlemem sekmesinden de verebilir.
                  </span>
                </span>
              </label>
            )}
            {error && <p className="text-sm text-destructive-strong">{error.text}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                <Link href="/ayarlar/olcumler">
                  <Settings2 />
                  Ölçüleri düzenle
                </Link>
              </Button>
              <Button type="button" onClick={save} loading={saving} disabled={!Object.values(values).some((v) => v.trim()) || (!consented && !attest)}>
                Kaydet
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Gri yazılar son ölçüm. Boş bıraktığın ölçüler kaydedilmez.</p>
          </section>
        ) : (
          <Button type="button" onClick={() => setOpen(true)} className="self-start">
            <Plus />
            Ölçüm ekle
          </Button>
        ))}

      <ProgressView series={series} emptyText={`${firstName} için henüz ölçüm yok. İlk ölçümü ekleyince grafik burada çıkar.`} />

      {!archived && <IntervalPicker clientId={clientId} every={every} />}

      {days.length > 0 && (
        <section aria-labelledby="measure-history-heading">
          <h2 id="measure-history-heading" className="mb-3 text-base font-semibold">
            Ölçüm geçmişi
          </h2>
          <ul className="divide-y overflow-hidden surface">
            {days.map((d) => (
              <li key={d.date} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{d.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {d.items.map((i) => `${i.metric.label} ${formatMetric(i.value, i.metric)}${i.byClient ? " (kendisi)" : ""}`).join(" · ")}
                  </p>
                </div>
                {!archived && (
                  <Button type="button" size="icon-sm" variant="ghost" className="text-muted-foreground" aria-label={`${d.label} ölçümlerini sil`} disabled={pending} onClick={() => removeDay(d)}>
                    <Trash2 />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function IntervalPicker({ clientId, every }: { clientId: string; every: number | null }) {
  const [value, setValue] = useState(every);
  const [pending, start] = useTransition();
  return (
    <section aria-labelledby="interval-heading" className="flex flex-col gap-3 surface p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <h2 id="interval-heading" className="text-base font-semibold">
          Ölçüm hatırlatması
        </h2>
        <p className="text-sm text-muted-foreground">
          Zamanı gelince Bugün ekranında görürsün; danışana da bildirim gider.
        </p>
      </div>
      <NativeSelect
        aria-label="Ölçüm sıklığı"
        value={value ?? ""}
        disabled={pending}
        className="sm:max-w-52"
        onChange={(e) => {
          const next = e.target.value ? Number(e.target.value) : null;
          const before = value;
          setValue(next);
          start(async () => {
            const res = await setMeasureIntervalAction(clientId, next);
            if (!res.ok) {
              setValue(before);
              toast.error(res.error);
            } else toast.success(next ? `${next / 7} haftada bir hatırlatılacak` : "Ölçüm hatırlatması kapandı");
          });
        }}
      >
        <option value="">Kapalı</option>
        {MEASURE_EVERY_OPTIONS.map((d) => (
          <option key={d} value={d}>
            {d / 7} haftada bir
          </option>
        ))}
      </NativeSelect>
    </section>
  );
}
