import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ProgramSheet } from "@/components/program-sheet";
import { adminDb, type Tx } from "@/db";
import { portalProgram } from "@/db/programs";
import { clients, trainers } from "@/db/schema";
import { resolvePortalToken } from "@/lib/portal";

export const metadata: Metadata = { title: "Yazdır", robots: { index: false } };

const KINDS = { antrenman: "workout", beslenme: "nutrition" } as const;

// The client's current program or nutrition plan as a printable page, behind their personal link.
export default async function PortalPrintPage({ params }: PageProps<"/p/[token]/yazdir/[tur]">) {
  const { token, tur } = await params;
  const kind = KINDS[tur as keyof typeof KINDS];
  if (!kind) notFound();
  const who = await resolvePortalToken(token);
  if (!who) notFound();
  const current = await portalProgram(adminDb as unknown as Tx, who, kind);
  if (!current) notFound();
  const [row] = await adminDb
    .select({ clientName: clients.fullName, fullName: trainers.fullName, businessName: trainers.businessName })
    .from(clients)
    .innerJoin(trainers, eq(trainers.id, clients.trainerId))
    .where(and(eq(clients.id, who.clientId), eq(clients.trainerId, who.trainerId)));
  if (!row) notFound();
  return <ProgramSheet program={current.program} clientName={row.clientName} trainerName={row.businessName || row.fullName} />;
}
