import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { ensureExerciseLibrary, listExercises } from "@/db/programs";
import { getTrainer } from "@/db/queries";
import { clients } from "@/db/schema";
import { safeNext } from "@/lib/config";
import { todayISO } from "@/lib/format";
import { ProgramEditor } from "../program-editor";

export const metadata: Metadata = { title: "Yeni program" };

export default async function NewProgramPage({ searchParams }: PageProps<"/programlar/yeni">) {
  const { tur, danisan } = await searchParams;
  const kind = tur === "beslenme" ? "nutrition" : "workout";
  const clientId = typeof danisan === "string" && /^[0-9a-f-]{36}$/i.test(danisan) ? danisan : null;
  const data = await withTrainer(async (tx, trainerId) => {
    await ensureExerciseLibrary(tx, trainerId);
    const library = await listExercises(tx, trainerId);
    const trainer = await getTrainer(tx, trainerId);
    const [client] = clientId
      ? await tx.select({ id: clients.id, name: clients.fullName }).from(clients).where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId)))
      : [];
    return { library, client: client ?? null, today: todayISO(trainer.timezone) };
  });
  if (clientId && !data.client) notFound();
  const workout = kind === "workout";
  const back = data.client ? `/danisanlar/${data.client.id}?sekme=${workout ? "program" : "beslenme"}` : `/programlar${workout ? "" : "?tur=beslenme"}`;

  return (
    <>
      <Link href={safeNext(back)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        {data.client ? data.client.name : "Programlar"}
      </Link>
      <PageHeader
        title={workout ? (data.client ? "Yeni antrenman programı" : "Yeni program şablonu") : data.client ? "Yeni beslenme planı" : "Yeni plan şablonu"}
        description={data.client ? `${data.client.name.split(" ")[0]} için. Kaydedince taslak olur; “Danışana gönder” deyince sayfasında görünür.` : undefined}
      />
      <ProgramEditor
        kind={kind}
        initial={data.client ? { name: "", note: null, startsOn: data.today, targets: {}, days: [] } : null}
        library={data.library}
        target={{ clientId: data.client?.id ?? null }}
        forClient={data.client?.name.split(" ")[0]}
      />
    </>
  );
}
