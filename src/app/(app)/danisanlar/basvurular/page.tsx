import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listApplications } from "@/db/applications";
import { getTrainer } from "@/db/queries";
import { formatDayMonth, formatTRY, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Başvurular" };

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  approved: { label: "Onaylandı", variant: "default" },
  rejected: { label: "Reddedildi", variant: "secondary" },
};

export default async function ApplicationsPage() {
  const { pending, decided, timezone } = await withTrainer(async (tx, trainerId) => {
    const { timezone } = await getTrainer(tx, trainerId);
    const pending = await listApplications(tx, trainerId, { status: "pending" });
    const decided = await listApplications(tx, trainerId, { status: "decided" });
    return { pending, decided, timezone };
  });

  return (
    <>
      <Link href="/danisanlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Danışanlar
      </Link>
      <PageHeader title="Başvurular" description="Sayfandan paket seçip kayıt olanlar." />

      <section aria-labelledby="pending-heading" className="mb-8">
        <h2 id="pending-heading" className="mb-3 text-sm font-medium text-muted-foreground">
          Onay bekleyenler
        </h2>
        {pending.length === 0 ? (
          <EmptyState icon={<Inbox />} title="Bekleyen başvuru yok">
            Sayfanın linkini Instagram bio&apos;na koyduğunda başvurular burada görünür.
          </EmptyState>
        ) : (
          <ul className="divide-y rounded-xl border">
            {pending.map((a) => (
              <li key={a.id}>
                <Link href={`/danisanlar/basvurular/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {a.clientName}
                      {a.clientStatus === "active" && <span className="ml-2 text-xs font-normal text-muted-foreground">mevcut danışan</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.packageName}
                      {a.packagePrice && ` · ${formatTRY(a.packagePrice)}`} · {formatDayMonth(a.createdAt, timezone)}{" "}
                      {formatTime(a.createdAt, timezone)}
                    </p>
                  </div>
                  <Badge>Yeni</Badge>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {decided.length > 0 && (
        <section aria-labelledby="decided-heading">
          <h2 id="decided-heading" className="mb-3 text-sm font-medium text-muted-foreground">
            Son kararlar
          </h2>
          <ul className="divide-y rounded-xl border">
            {decided.map((a) => (
              <li key={a.id}>
                <Link href={`/danisanlar/basvurular/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.clientName}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.packageName}</p>
                  </div>
                  <Badge variant={STATUS[a.status].variant}>{STATUS[a.status].label}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
