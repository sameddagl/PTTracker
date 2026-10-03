import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ChevronRight, FileSpreadsheet, Inbox, UserPlus, Users } from "lucide-react";
import { ActionTiles } from "@/components/action-tiles";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { ApplicationsBanner } from "@/components/applications-banner";
import { countPendingApplications } from "@/db/applications";
import { countArchivedClients } from "@/db/clients";
import { getTrainer, listClients } from "@/db/queries";
import { clientIdsTaughtBy } from "@/db/team";
import { cn } from "@/lib/utils";
import { formatTRY } from "@/lib/format";

export const metadata: Metadata = { title: "Danışanlar" };

export default async function ClientsPage({ searchParams }: PageProps<"/danisanlar">) {
  const { kapsam } = await searchParams;
  const { clients, pending, archived, owner, mineOnly, canSeeAll } = await withTrainer(async (tx, trainerId, member) => {
    const owner = member.role === "owner";
    const all = await listClients(tx, trainerId);
    if (owner) return { clients: all, pending: await countPendingApplications(tx, trainerId), archived: await countArchivedClients(tx, trainerId), owner, mineOnly: false, canSeeAll: true };
    // Instructors start on the clients they teach; the studio decides whether they may list everyone.
    const canSeeAll = (await getTrainer(tx, trainerId)).instructorsSeeAllClients;
    const mineOnly = !(canSeeAll && kapsam === "tumu");
    const mine = mineOnly ? await clientIdsTaughtBy(tx, trainerId, member.id) : null;
    return { clients: mine ? all.filter((c) => mine.has(c.id)) : all, pending: 0, archived: 0, owner, mineOnly, canSeeAll };
  });

  return (
    <>
      <PageHeader
        title="Danışanlar"
        description={clients.length > 0 ? `${clients.length} aktif danışan` : undefined}
      />
      {!owner && canSeeAll && (
        <nav aria-label="Liste" className="mb-4 flex gap-2">
          {[
            { href: "/danisanlar", label: "Benim danışanlarım", on: mineOnly },
            { href: "/danisanlar?kapsam=tumu", label: "Tümü", on: !mineOnly },
          ].map((o) => (
            <Link
              key={o.href}
              href={o.href}
              aria-current={o.on ? "true" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors md:min-h-9",
                o.on ? "bg-foreground text-background" : "bg-card text-muted-foreground shadow-card hover:text-foreground",
              )}
            >
              {o.label}
            </Link>
          ))}
        </nav>
      )}
      {/* The empty state below has its own buttons for these. */}
      {owner && clients.length > 0 && (
        <ActionTiles
          className="mb-6"
          items={[
            { href: "/danisanlar/yeni", icon: <UserPlus />, title: "Yeni danışan", primary: true },
            { href: "/danisanlar/ice-aktar", icon: <FileSpreadsheet />, title: "Excel'den aktar" },
            { href: "/danisanlar/basvurular", icon: <Inbox />, title: pending > 0 ? `Başvurular (${pending})` : "Başvurular" },
          ]}
        />
      )}

      <ApplicationsBanner count={pending} />

      {clients.length === 0 && !owner ? (
        <EmptyState icon={<Users />} title={mineOnly ? "Henüz ders verdiğin danışan yok" : "Henüz danışan yok"}>
          {mineOnly ? "Derslerine yazılan danışanlar burada görünür." : "Stüdyoya eklenen danışanlar burada görünür."}
        </EmptyState>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Henüz danışan yok"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild size="sm">
                <Link href="/danisanlar/yeni">
                  <UserPlus />
                  İlk danışanını ekle
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/danisanlar/ice-aktar">
                  <FileSpreadsheet />
                  Excel&apos;den aktar
                </Link>
              </Button>
            </div>
          }
        >
          Danışanlarının paket, ders ve ödemelerini burada takip edersin. Sayfandan başvuranlar da sen onaylayınca buraya eklenir. Listen Excel&apos;deyse hepsini tek seferde aktar.
        </EmptyState>
      ) : (
        <ul className="divide-y overflow-hidden surface">
          {clients.map((c) => {
            const pkg = c.packages[0];
            const due = c.packages.reduce((sum, p) => sum + Number(p.due), 0);
            const low = pkg && pkg.remaining <= 2 && pkg.state !== "frozen";
            return (
              <li key={c.id}>
                <Link href={`/danisanlar/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50">
                  <Avatar name={c.fullName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.fullName}</p>
                    {pkg ? (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted" aria-hidden>
                          <div
                            className={low ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-foreground"}
                            style={{ width: `${pkg.total > 0 ? (pkg.remaining / pkg.total) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {pkg.remaining}/{pkg.total} · {pkg.name}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">Aktif paket yok</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {owner && due > 0 && <Badge variant="destructive">{formatTRY(due)}</Badge>}
                    {pkg?.state === "frozen" && <Badge variant="secondary">Donduruldu</Badge>}
                    {low && <Badge variant="warning">{pkg.remaining === 0 ? "Bitti" : "Azaldı"}</Badge>}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {archived > 0 && (
        <Link
          href="/danisanlar/arsiv"
          className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Archive className="size-4" aria-hidden />
          Arşivdeki danışanlar ({archived})
        </Link>
      )}
    </>
  );
}
