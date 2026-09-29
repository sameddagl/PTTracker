import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listClientOptions } from "@/db/lessons";
import { listPayablePackages } from "@/db/payments";
import { getTrainer } from "@/db/queries";
import { safeNext } from "@/lib/config";
import { todayISO } from "@/lib/format";
import { PaymentForm } from "./payment-form";

export const metadata: Metadata = { title: "Ödeme al" };

export default async function NewPaymentPage({ searchParams }: PageProps<"/odemeler/yeni">) {
  const { danisan, paket, next } = await searchParams;
  const data = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    const clients = await listClientOptions(tx, trainerId);
    const packages = await listPayablePackages(tx, trainerId);
    return { clients, packages, today: todayISO(trainer.timezone) };
  });

  const back = safeNext(typeof next === "string" ? next : undefined, "/odemeler");
  const clientId = typeof danisan === "string" && data.clients.some((c) => c.id === danisan) ? danisan : "";

  return (
    <>
      <Link href={back} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Geri
      </Link>
      <PageHeader title="Ödeme al" />
      {data.clients.length === 0 ? (
        <EmptyState icon={<UserPlus />} title="Önce bir danışan ekle">
          <Button asChild size="sm" className="mt-2">
            <Link href="/danisanlar/yeni">Danışan ekle</Link>
          </Button>
        </EmptyState>
      ) : (
        <PaymentForm
          clients={data.clients}
          packages={data.packages}
          initialClientId={clientId}
          initialPackageId={typeof paket === "string" ? paket : ""}
          today={data.today}
          next={back}
        />
      )}
    </>
  );
}
