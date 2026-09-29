import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getTemplate } from "@/db/packages";
import { TemplateForm } from "../template-form";

export const metadata: Metadata = { title: "Şablonu düzenle" };

export default async function EditTemplatePage({ params }: PageProps<"/ayarlar/paketler/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const t = await withTrainer((tx, trainerId) => getTemplate(tx, trainerId, id));
  if (!t) notFound();

  return (
    <>
      <Link href="/ayarlar/paketler" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Paket şablonları
      </Link>
      <PageHeader title={t.name} description="Değişiklikler daha önce satılmış paketleri etkilemez." />
      <TemplateForm
        id={t.id}
        initial={{
          name: t.name,
          sessionType: t.sessionType,
          sessionCount: String(t.sessionCount),
          validityDays: t.validityDays ? String(t.validityDays) : "",
          price: t.price ? String(Number(t.price)) : "",
          makeupAllowance: String(t.makeupAllowance),
          isPublic: t.isPublic,
          description: t.description ?? "",
          features: t.features.join("\n"),
          sortOrder: t.sortOrder ? String(t.sortOrder) : "",
          installments: String(t.installments),
        }}
      />
    </>
  );
}
