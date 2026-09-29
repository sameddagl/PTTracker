import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listClients } from "@/db/queries";
import { formatTRY } from "@/lib/format";

export const metadata: Metadata = { title: "Danışanlar" };

export default async function ClientsPage() {
  const clients = await withTrainer((tx, trainerId) => listClients(tx, trainerId));

  return (
    <>
      <PageHeader
        title="Danışanlar"
        description={clients.length > 0 ? `${clients.length} aktif danışan` : undefined}
        action={
          <Button asChild>
            <Link href="/danisanlar/yeni">
              <UserPlus />
              <span className="max-sm:sr-only">Yeni danışan</span>
            </Link>
          </Button>
        }
      />

      {clients.length === 0 ? (
        <EmptyState icon={<Users />} title="Henüz danışan yok">
          İlk danışanını ekle. Yakında Excel listeni de tek seferde içe aktarabileceksin.
        </EmptyState>
      ) : (
        <ul className="divide-y rounded-xl border">
          {clients.map((c) => {
            const pkg = c.packages[0];
            const due = c.packages.reduce((sum, p) => sum + Number(p.due), 0);
            return (
              <li key={c.id}>
                <Link
                  href={`/danisanlar/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {pkg ? `${pkg.name} · ${pkg.remaining}/${pkg.total} ders kaldı` : "Aktif paket yok"}
                    </p>
                  </div>
                  {pkg?.state === "frozen" && <Badge variant="secondary">Donduruldu</Badge>}
                  {pkg && pkg.remaining <= 2 && pkg.state !== "frozen" && (
                    <Badge variant="outline">{pkg.remaining === 0 ? "Bitti" : "Azaldı"}</Badge>
                  )}
                  {due > 0 && <Badge variant="destructive">{formatTRY(due)}</Badge>}
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
