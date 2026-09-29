import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listTemplates } from "@/db/packages";
import { getTrainer } from "@/db/queries";
import { clients } from "@/db/schema";
import { todayISO } from "@/lib/format";
import { SellForm } from "./sell-form";

export const metadata: Metadata = { title: "Paket sat" };

export default async function SellPackagePage({ params }: PageProps<"/danisanlar/[id]/paket-sat">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const data = await withTrainer(async (tx, trainerId) => {
    const [client] = await tx
      .select({ id: clients.id, fullName: clients.fullName })
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.trainerId, trainerId)));
    if (!client) return null;
    const trainer = await getTrainer(tx, trainerId);
    const templates = await listTemplates(tx, trainerId, { activeOnly: true });
    return { client, templates, today: todayISO(trainer.timezone) };
  });
  if (!data) notFound();

  return (
    <>
      <Link
        href={`/danisanlar/${id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {data.client.fullName}
      </Link>
      <PageHeader title="Paket sat" />
      <SellForm clientId={id} templates={data.templates} today={data.today} />
    </>
  );
}
