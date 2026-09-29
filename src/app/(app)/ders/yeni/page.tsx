import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listClientOptions } from "@/db/lessons";
import { getTrainer } from "@/db/queries";
import { safeNext } from "@/lib/config";
import { isISODate } from "@/lib/dates";
import { nextHourISO, todayISO } from "@/lib/format";
import { LessonForm } from "./lesson-form";

export const metadata: Metadata = { title: "Ders ekle" };

export default async function NewLessonPage({ searchParams }: PageProps<"/ders/yeni">) {
  const { danisan, next, tarih, saat } = await searchParams;
  const { clients, trainer } = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    const clients = await listClientOptions(tx, trainerId);
    return { clients, trainer };
  });

  const preselected = typeof danisan === "string" && clients.some((c) => c.id === danisan) ? [danisan] : [];
  const back = safeNext(typeof next === "string" ? next : undefined);

  return (
    <>
      <Link href={back} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Geri
      </Link>
      <PageHeader title="Ders ekle" />
      {clients.length === 0 ? (
        <EmptyState icon={<UserPlus />} title="Önce bir danışan ekle">
          <Button asChild size="sm" className="mt-2">
            <Link href="/danisanlar/yeni">Danışan ekle</Link>
          </Button>
        </EmptyState>
      ) : (
        <LessonForm
          clients={clients}
          preselected={preselected}
          today={todayISO(trainer.timezone)}
          defaultDate={isISODate(tarih) ? tarih : todayISO(trainer.timezone)}
          defaultTime={typeof saat === "string" && /^\d{2}:\d{2}$/.test(saat) ? saat : nextHourISO(trainer.timezone)}
          next={back}
        />
      )}
    </>
  );
}
