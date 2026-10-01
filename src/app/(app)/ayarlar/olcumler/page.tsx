import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listMeasurementTypes } from "@/db/progress";
import { getTrainer } from "@/db/queries";
import { BUILTIN_METRICS, DEFAULT_METRICS } from "@/lib/measurements";
import { MetricSettings } from "./metric-settings";

export const metadata: Metadata = { title: "Ölçümler" };

export default async function MeasureSettingsPage() {
  const { trainer, custom } = await withTrainer(async (tx, id) => ({ trainer: await getTrainer(tx, id), custom: await listMeasurementTypes(tx, id) }));
  const selected = trainer.measureMetrics ?? DEFAULT_METRICS;
  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader title="Ölçümler" description="“Ölçüm ekle” formunda çıkan ölçüler. İstemediğini kaldır, eksik olanı ekle." />
      <MetricSettings
        catalog={[
          ...BUILTIN_METRICS.map((m) => ({ key: m.key, label: m.label, unit: m.unit, custom: false })),
          ...custom.filter((t) => !t.archivedAt).map((t) => ({ key: t.id, label: t.label, unit: t.unit, custom: true })),
        ]}
        selected={selected}
        selfWeigh={trainer.clientsSelfWeigh}
      />
    </>
  );
}
