import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { JOIN_MODE_LABELS, ensureGroupOccurrences, listGroupClasses } from "@/db/groups";
import { getTrainer } from "@/db/queries";
import { weekdayList } from "@/lib/dates";

export const metadata: Metadata = { title: "Grup dersleri" };

export default async function GroupClassesPage() {
  const classes = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    await ensureGroupOccurrences(tx, trainer);
    return listGroupClasses(tx, trainer);
  });

  return (
    <>
      <Link href="/takvim" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Takvim
      </Link>
      <PageHeader
        title="Grup dersleri"
        description="Her hafta aynı gün ve saatte yapılan, kişi sınırı olan dersler. Takvimde kaç yerin dolu olduğunu görürsün."
        action={
          <Button asChild>
            <Link href="/takvim/grup/yeni">
              <Plus />
              <span className="max-sm:sr-only">Yeni grup dersi</span>
            </Link>
          </Button>
        }
      />
      {classes.length === 0 ? (
        <EmptyState
          icon={<UsersRound />}
          title="Henüz grup dersi yok"
          action={
            <Button asChild size="sm">
              <Link href="/takvim/grup/yeni">
                <Plus />
                Grup dersi oluştur
              </Link>
            </Button>
          }
        >
          Dersi bir kez oluştur, her hafta takvime kendiliğinden eklensin. Örneğin Salı ve Perşembe 18:00, 8 kişilik Grup Reformer.
        </EmptyState>
      ) : (
        <ul className="divide-y overflow-hidden surface">
          {classes.map((c) => (
            <li key={c.id}>
              <Link href={`/takvim/grup/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                  <p className={c.live ? "truncate font-medium" : "truncate font-medium text-muted-foreground"}>{c.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {weekdayList(c.weekdays)} · {c.startTime} · {c.capacity} kişi
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {JOIN_MODE_LABELS[c.joinMode]}
                    {c.joinMode !== "drop_in" && ` · ${c.members} sabit üye`}
                  </p>
                </div>
                {!c.live && <Badge variant="secondary">Bitti</Badge>}
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
