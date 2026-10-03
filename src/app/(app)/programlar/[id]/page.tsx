import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listMembers } from "@/db/team";
import { can, mayEditShared } from "@/lib/permissions";
import { getProgram, listExercises } from "@/db/programs";
import { clients } from "@/db/schema";
import { toInputDays } from "@/lib/programs";
import { ProgramEditor } from "../program-editor";
import { ProgramHeaderActions } from "./header-actions";

export const metadata: Metadata = { title: "Program" };

export default async function ProgramPage({ params }: PageProps<"/programlar/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await withTrainer(async (tx, trainerId, member) => {
    const program = await getProgram(tx, trainerId, id);
    if (!program) return null;
    // A shared template: its maker (with permission) or someone allowed to edit everyone's; a client's program always.
    if (program.clientId === null && !mayEditShared(member, program.createdBy)) return null;
    const team = await listMembers(tx, trainerId, { includeInactive: true });
    const owner = team.find((m) => m.role === "owner");
    const maker = team.length > 1 ? (team.find((m) => m.id === program.createdBy) ?? owner)?.fullName : null;
    const library = program.kind === "workout" ? await listExercises(tx, trainerId) : [];
    const [client] = program.clientId
      ? await tx.select({ id: clients.id, name: clients.fullName }).from(clients).where(and(eq(clients.id, program.clientId), eq(clients.trainerId, trainerId)))
      : [];
    return { program, library, client: client ?? null, canTemplate: can(member, "createPrograms"), maker };
  });
  if (!data) notFound();
  const { program, library, client, canTemplate, maker } = data;
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
            : `${maker ? `${maker} hazırladı. ` : ""}Şablon. Danışana verdiğinde kopyası oluşur; şablonu değiştirmek verilen programları etkilemez.`
        }
        action={<ProgramHeaderActions id={program.id} isTemplate={!client} canTemplate={canTemplate} />}
      />
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
