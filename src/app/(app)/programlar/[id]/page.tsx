import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ChevronLeft, Printer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listClientOptions } from "@/db/lessons";
import { clientIdsTaughtBy, listMembers } from "@/db/team";
import { PersonChip } from "@/components/person-chip";
import { ProgramBody } from "@/components/program-sheet";
import { Button } from "@/components/ui/button";
import { teamColor } from "@/lib/team";
import { GiveTemplate } from "./give-template";
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
    // A shared template is editable by its maker (with permission) or someone allowed to edit everyone's;
    // anyone else sees it read-only and can give a copy to a client. A client's program is always editable.
    const editable = program.clientId !== null || mayEditShared(member, program.createdBy);
    const team = await listMembers(tx, trainerId, { includeInactive: true });
    const ownerIndex = team.findIndex((m) => m.role === "owner");
    const makerIndex = Math.max(team.findIndex((m) => m.id === program.createdBy), ownerIndex);
    const maker = team.length > 1 && makerIndex >= 0 ? { name: team[makerIndex].fullName, color: teamColor(team[makerIndex].color, makerIndex) } : null;
    if (!editable) {
      // Clients this member may give it to.
      const options = await listClientOptions(tx, trainerId);
      const mine = can(member, "seeAllClients") ? null : await clientIdsTaughtBy(tx, trainerId, member.id);
      return { program, editable, maker, clients: mine ? options.filter((c) => mine.has(c.id)) : options } as const;
    }
    const library = program.kind === "workout" ? await listExercises(tx, trainerId) : [];
    const [client] = program.clientId
      ? await tx.select({ id: clients.id, name: clients.fullName }).from(clients).where(and(eq(clients.id, program.clientId), eq(clients.trainerId, trainerId)))
      : [];
    return { program, editable, library, client: client ?? null, canTemplate: can(member, "createPrograms"), maker } as const;
  });
  if (!data) notFound();
  const { program, maker } = data;
  const workout = program.kind === "workout";

  if (!data.editable) {
    return (
      <>
        <Link href={`/programlar${workout ? "" : "?tur=beslenme"}`} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" aria-hidden />
          Programlar
        </Link>
        <PageHeader
          title={program.name}
          description="Şablon. Değiştiremezsin; kopyasını danışanına verip ona göre düzenleyebilirsin."
          action={
            <Button asChild size="icon" variant="outline" aria-label="Yazdır ya da PDF olarak kaydet" title="Yazdır / PDF">
              <a href={`/yazdir/${program.id}`} target="_blank">
                <Printer />
              </a>
            </Button>
          }
        />
        {maker && (
          <p className="-mt-2 mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            Hazırlayan <PersonChip name={maker.name} color={maker.color} />
          </p>
        )}
        <section aria-label="Danışana ver" className="mb-6 surface p-5">
          <GiveTemplate templateId={program.id} clients={data.clients} />
        </section>
        <div className="flex flex-col gap-6 surface p-5">
          <ProgramBody program={program} />
        </div>
      </>
    );
  }
  const { library, client, canTemplate } = data;
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
        action={<ProgramHeaderActions id={program.id} isTemplate={!client} canTemplate={canTemplate} />}
      />
      {!client && maker && (
        <p className="-mt-2 mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          Hazırlayan <PersonChip name={maker.name} color={maker.color} />
        </p>
      )}
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
