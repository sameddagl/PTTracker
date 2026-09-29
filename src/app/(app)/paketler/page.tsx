import type { Metadata } from "next";
import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listTemplates } from "@/db/packages";
import { TemplateList } from "./template-list";

export const metadata: Metadata = { title: "Paketler" };

export default async function PackagesPage() {
  const templates = await withTrainer((tx, trainerId) => listTemplates(tx, trainerId));

  return (
    <>
      <PageHeader
        title="Paketler"
        description="Sattığın paketleri bir kez tanımla. Sayfanda ve satarken bu sırayla görünürler."
        action={
          <Button asChild>
            <Link href="/paketler/yeni">
              <Plus />
              <span className="max-sm:sr-only">Yeni paket</span>
            </Link>
          </Button>
        }
      />
      {templates.length === 0 ? (
        <EmptyState icon={<Package />} title="Henüz paket yok">
          8 ya da 12 derslik paketlerini ekle; danışana satarken tek dokunuşla seçersin.
        </EmptyState>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">Sıralamak için tutamaktan sürükle.</p>
          <TemplateList templates={templates} />
        </>
      )}
    </>
  );
}
