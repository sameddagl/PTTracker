import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { countUpcomingLessons } from "@/db/clients";
import { clients, consents } from "@/db/schema";
import { formatPhone } from "@/lib/whatsapp";
import { ClientForm } from "../../yeni/client-form";
import { ArchiveCard } from "./archive-card";

export const metadata: Metadata = { title: "Danışanı düzenle" };

export default async function EditClientPage({ params }: PageProps<"/danisanlar/[id]/duzenle">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const data = await withTrainer(async (tx, trainerId) => {
    const [client] = await tx
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.trainerId, trainerId), eq(clients.status, "active")));
    if (!client) return null;
    const consent = await tx
      .select({ id: consents.id })
      .from(consents)
      .where(and(eq(consents.clientId, id), eq(consents.kind, "health_data"), isNull(consents.revokedAt)))
      .limit(1);
    const upcoming = await countUpcomingLessons(tx, id);
    return { client, hasConsent: consent.length > 0, upcoming };
  });
  if (!data) notFound();
  const { client, hasConsent, upcoming } = data;

  return (
    <>
      <Link
        href={`/danisanlar/${client.id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {client.fullName}
      </Link>
      <PageHeader title="Danışanı düzenle" />
      <ClientForm client={{ ...client, phone: formatPhone(client.phone) }} hasConsent={hasConsent} />
      {!client.archivedAt && <ArchiveCard clientId={client.id} name={client.fullName} upcoming={upcoming} />}
    </>
  );
}
