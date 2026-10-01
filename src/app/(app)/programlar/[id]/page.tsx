import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getProgram, listExercises } from "@/db/programs";
import { clients } from "@/db/schema";
import { toInputDays } from "@/lib/programs";
import { ProgramEditor } from "../program-editor";
import { ProgramHeaderActions } from "./header-actions";
import { PlanPdf } from "./plan-pdf";

export const metadata: Metadata = { title: "Program" };

export default async function ProgramPage({ params }: PageProps<"/programlar/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await withTrainer(async (tx, trainerId) => {
    const program = await getProgram(tx, trainerId, id);
    if (!program) return null;
    const library = program.kind === "workout" ? await listExercises(tx, trainerId) : [];
    const [client] = program.clientId
      ? await tx.select({ id: clients.id, name: clients.fullName }).from(clients).where(and(eq(clients.id, program.clientId), eq(clients.trainerId, trainerId)))
      : [];
    return { program, library, client: client ?? null };
  });
  if (!data) notFound();
  const { program, library, client } = data;
  const workout = program.kind === "workout";
  const back = client ? `/danisanlar/${client.id}?sekme=${workout ? "program" : "beslenme"}` : `/programlar${workout ? "" : "?tur=beslenme"}`;

  return (
    <>
      <Link href={back} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        {client ? client.name : "Programlar"}
      </Link>
      <PageHeader
        title={program.name}
        description={
          client
            ? program.sentAt
              ? `${client.name.split(" ")[0]} bu programı sayfasında görüyor. Değişiklikleri kaydedince o da görür.`
              : `Taslak: ${client.name.split(" ")[0]} henüz görmüyor. Danışanın Program sekmesinden gönderebilirsin.`
            : "Şablon. Danışana verdiğinde kopyası oluşur; şablonu değiştirmek verilen programları etkilemez."
        }
        action={<ProgramHeaderActions id={program.id} isTemplate={!client} />}
      />
      {!workout && <PlanPdf programId={program.id} fileName={program.pdfName} />}
      <ProgramEditor
        kind={program.kind}
        initial={{
          name: program.name,
          note: program.note,
          startsOn: program.startsOn,
          targets: program.targets,
          days: toInputDays(program.days),
        }}
        library={library}
        target={{ id: program.id }}
        forClient={client?.name.split(" ")[0]}
      />
    </>
  );
}
