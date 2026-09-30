import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { ensureDefaultIntakeFields, listIntakeFields } from "@/db/intake";
import { getTrainer } from "@/db/queries";
import { FieldList } from "./field-list";

export const metadata: Metadata = { title: "Kayıt formu" };

export default async function IntakeFormPage() {
  const { fields, trainer } = await withTrainer(async (tx, trainerId) => {
    await ensureDefaultIntakeFields(tx, trainerId);
    const trainer = await getTrainer(tx, trainerId);
    const fields = await listIntakeFields(tx, trainerId);
    return { fields, trainer };
  });

  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader
        title="Kayıt formu"
        description="Sayfandan paket seçen danışanlara bu soruları sorarsın. Cevaplar danışanın kaydına eklenir."
      />
      {trainer.publicPageEnabled && trainer.slug && (
        <a
          href={`/${trainer.slug}/kayit`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-flex items-center gap-1 text-sm text-primary underline-offset-2 hover:underline"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Formu önizle
        </a>
      )}
      <FieldList
        fields={fields.map((f) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          helpText: f.helpText ?? "",
          unit: f.unit ?? "",
          min: f.min ?? "",
          max: f.max ?? "",
          options: f.options.join("\n"),
          required: f.required,
          isHealth: f.isHealth,
          isActive: f.isActive,
        }))}
      />
    </>
  );
}
