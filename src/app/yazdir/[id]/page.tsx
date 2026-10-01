import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ProgramSheet } from "@/components/program-sheet";
import { withTrainer } from "@/db";
import { getProgram } from "@/db/programs";
import { getTrainer } from "@/db/queries";
import { clients } from "@/db/schema";

export const metadata: Metadata = { title: "Yazdır", robots: { index: false } };

// A trainer's program (template or a client's copy) as a printable page, outside the app chrome.
export default async function PrintProgramPage({ params }: PageProps<"/yazdir/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await withTrainer(async (tx, trainerId) => {
    const program = await getProgram(tx, trainerId, id);
    if (!program) return null;
    const trainer = await getTrainer(tx, trainerId);
    const [client] = program.clientId
      ? await tx.select({ name: clients.fullName }).from(clients).where(and(eq(clients.id, program.clientId), eq(clients.trainerId, trainerId)))
      : [];
    return { program, clientName: client?.name ?? null, trainerName: trainer.businessName || trainer.fullName };
  });
  if (!data) notFound();
  return <ProgramSheet {...data} />;
}
