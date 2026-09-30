import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listArchivedClients } from "@/db/clients";
import { getTrainer } from "@/db/queries";
import { formatDayMonth } from "@/lib/format";

export const metadata: Metadata = { title: "Arşiv" };

export default async function ArchivedClientsPage() {
  const { archived, timezone } = await withTrainer(async (tx, trainerId) => ({
    archived: await listArchivedClients(tx, trainerId),
    timezone: (await getTrainer(tx, trainerId)).timezone,
  }));

  return (
    <>
      <Link href="/danisanlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Danışanlar
      </Link>
      <PageHeader title="Arşiv" description="Arşive aldığın danışanlar ve geçmişleri burada durur." />

      {archived.length === 0 ? (
        <EmptyState icon={<Archive />} title="Arşiv boş">
          Gelmeyi bırakan bir danışanı düzenleme sayfasından arşive alabilirsin.
        </EmptyState>
      ) : (
        <ul className="divide-y overflow-hidden surface">
          {archived.map((c) => (
            <li key={c.id}>
              <Link href={`/danisanlar/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.fullName}</p>
                  <p className="text-xs text-muted-foreground">{c.archivedAt && `${formatDayMonth(c.archivedAt, timezone)} tarihinde arşivlendi`}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
