import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Dumbbell, ListChecks, Plus, Salad } from "lucide-react";
import { ActionTiles } from "@/components/action-tiles";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listMembers } from "@/db/team";
import { can, mayEditShared } from "@/lib/permissions";
import { ensureExerciseLibrary, listTemplates } from "@/db/programs";
import { formatShortDate } from "@/lib/format";
import { PendingLink } from "@/components/navigation-pending";

export const metadata: Metadata = { title: "Programlar" };

export default async function ProgramsPage({ searchParams }: PageProps<"/programlar">) {
  const { tur } = await searchParams;
  const kind = tur === "beslenme" ? "nutrition" : "workout";
  const { templates, canCreate } = await withTrainer(async (tx, trainerId, member) => {
    await ensureExerciseLibrary(tx, trainerId);
    const team = await listMembers(tx, trainerId, { includeInactive: true });
    const ownerName = team.find((m) => m.role === "owner")?.fullName ?? null;
    // Studios: who made each template, and whether this member may change it.
    const templates = (await listTemplates(tx, trainerId, kind)).map((t) => ({
      ...t,
      maker: team.length > 1 ? (team.find((m) => m.id === t.createdBy)?.fullName ?? ownerName) : null,
      editable: mayEditShared(member, t.createdBy),
    }));
    return { templates, canCreate: can(member, "createPrograms") };
  });
  const workout = kind === "workout";

  return (
    <>
      <PageHeader title="Programlar" description="Şablonu bir kez hazırla, danışanlarına kopyalayıp kişiye göre düzenle." />
      <nav aria-label="Program türü" className="mb-6">
        <ul className="flex w-max gap-1 rounded-full bg-muted p-1">
          {[
            { href: "/programlar", label: "Antrenman", on: workout },
            { href: "/programlar?tur=beslenme", label: "Beslenme", on: !workout },
          ].map((t) => (
            <li key={t.href}>
              <PendingLink
                href={t.href}
                aria-current={t.on ? "page" : undefined}
                className={`flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors ${t.on ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </PendingLink>
            </li>
          ))}
        </ul>
      </nav>

      <ActionTiles
        className="mb-6"
        items={[
          ...(canCreate
            ? [{ href: `/programlar/yeni${workout ? "" : "?tur=beslenme"}`, icon: <Plus />, title: workout ? "Yeni şablon" : "Yeni plan şablonu", primary: true }]
            : []),
          ...(workout ? [{ href: "/programlar/hareketler", icon: <ListChecks />, title: "Hareketler" }] : []),
          { href: "/danisanlar", icon: workout ? <Dumbbell /> : <Salad />, title: "Danışana ver" },
        ]}
      />

      {templates.length === 0 ? (
        <EmptyState icon={workout ? <Dumbbell /> : <Salad />} title={workout ? "Henüz şablon yok" : "Henüz plan şablonu yok"}>
          {workout
            ? "Sık verdiğin programları şablon olarak kaydet; danışanın sayfasındaki Program sekmesinden tek seferde kopyalarsın."
            : "Sık kullandığın beslenme planlarını şablon olarak kaydet; danışanın Beslenme sekmesinden kopyalarsın."}
        </EmptyState>
      ) : (
        <ul className="divide-y overflow-hidden surface">
          {templates.map((t) => (
            <li key={t.id}>
              {t.editable ? (
                <Link href={`/programlar/${t.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{t.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t.maker && `${t.maker} · `}
                      {t.days} {workout ? "gün" : "öğün"} · {formatShortDate(t.updatedAt.toISOString().slice(0, 10))} güncellendi
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              ) : (
                // Without permission to change templates, an instructor uses them from the client's page.
                <span className="block px-4 py-3.5">
                  <span className="block truncate font-medium">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t.maker && `${t.maker} · `}
                    {t.days} {workout ? "gün" : "öğün"} · danışanın sayfasından kopyalarsın
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
