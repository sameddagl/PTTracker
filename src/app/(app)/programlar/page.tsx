import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Dumbbell, ListChecks, Plus, Salad } from "lucide-react";
import { ActionTiles } from "@/components/action-tiles";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { ensureExerciseLibrary, listTemplates } from "@/db/programs";
import { formatShortDate } from "@/lib/format";

export const metadata: Metadata = { title: "Programlar" };

export default async function ProgramsPage({ searchParams }: PageProps<"/programlar">) {
  const { tur } = await searchParams;
  const kind = tur === "beslenme" ? "nutrition" : "workout";
  const templates = await withTrainer(async (tx, trainerId) => {
    await ensureExerciseLibrary(tx, trainerId);
    return listTemplates(tx, trainerId, kind);
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
              <Link
                href={t.href}
                aria-current={t.on ? "page" : undefined}
                className={`flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors ${t.on ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ActionTiles
        className="mb-6"
        items={[
          { href: `/programlar/yeni${workout ? "" : "?tur=beslenme"}`, icon: <Plus />, title: workout ? "Yeni şablon" : "Yeni plan şablonu", primary: true },
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
              <Link href={`/programlar/${t.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t.days} {workout ? "gün" : "öğün"} · {formatShortDate(t.updatedAt.toISOString().slice(0, 10))} güncellendi
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
