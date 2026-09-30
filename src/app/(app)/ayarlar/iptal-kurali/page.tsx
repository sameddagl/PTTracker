import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { LateCancelForm } from "./late-cancel-form";

export const metadata: Metadata = { title: "Geç iptal kuralı" };

export default async function LateCancelPage() {
  const trainer = await withTrainer((tx, id) => getTrainer(tx, id));
  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader
        title="Geç iptal kuralı"
        description="Danışan dersi geç iptal ederse ders paketinden düşer. Bu süre danışanın kendi sayfasında da yazar."
      />
      <div className="surface p-5">
        <LateCancelForm initial={trainer.lateCancelHours} />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Değişiklik bundan sonraki iptallere uygulanır; önceki yoklamalar olduğu gibi kalır.
      </p>
    </>
  );
}
