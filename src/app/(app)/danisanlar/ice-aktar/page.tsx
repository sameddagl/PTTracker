import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ImportWizard } from "./import-wizard";

export const metadata: Metadata = { title: "Excel'den aktar" };

export default function ImportClientsPage() {
  return (
    <>
      <Link
        href="/danisanlar"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Danışanlar
      </Link>
      <PageHeader
        title="Excel'den aktar"
        description="Danışan listeni Excel ya da CSV dosyasından tek seferde ekle. Kalan ders ve borçlar paket olarak açılır."
      />
      <ImportWizard />
    </>
  );
}
