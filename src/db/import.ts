import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import type { Tx } from "./index";
import { sellPackage } from "./packages";
import { clients } from "./schema";
import { todayISO } from "@/lib/format";
import { MAX_IMPORT_ROWS, summarize, validateRows, type ColumnMapping, type RowResult } from "@/lib/import/clients";
import { normalizePhone } from "@/lib/whatsapp";

type TrainerRef = { id: string; timezone: string };

/** Normalized phones of all the trainer's clients (archived and applicants too). */
export async function existingPhones(tx: Tx, trainerId: string) {
  const rows = await tx
    .select({ phone: clients.phone })
    .from(clients)
    .where(and(eq(clients.trainerId, trainerId), isNotNull(clients.phone)));
  return new Set(rows.map((r) => normalizePhone(r.phone)).filter((p): p is string => p !== null));
}

export type ImportResult = {
  created: number;
  packages: number;
  /** Rows not imported, with the reasons. */
  skipped: Pick<RowResult, "line" | "status" | "reasons">[];
};

/**
 * Creates the valid rows as clients (source "manual"), each with a package
 * when sessions are left or money is owed. Rows are re-validated here, so the
 * browser preview is only a convenience. Health data is never imported: it
 * needs the client's explicit consent.
 */
export async function importClients(
  tx: Tx,
  trainer: TrainerRef,
  rows: string[][],
  mapping: ColumnMapping,
  { lines }: { lines?: number[] } = {},
): Promise<ImportResult> {
  if (rows.length > MAX_IMPORT_ROWS) throw new Error(`At most ${MAX_IMPORT_ROWS} rows`);
  const today = todayISO(trainer.timezone);
  const results = validateRows(rows, mapping, { existingPhones: await existingPhones(tx, trainer.id), today, lines });

  // Ids are generated here so each package can point at its client without
  // relying on the order of a bulk insert's RETURNING rows.
  const toCreate = results.filter((r) => r.status === "ok").map((r) => ({ id: randomUUID(), ...r.client }));
  for (let i = 0; i < toCreate.length; i += 100) {
    await tx.insert(clients).values(
      toCreate.slice(i, i + 100).map(({ id, fullName, phone, email, goals, notes }) => ({
        id,
        trainerId: trainer.id,
        fullName,
        phone,
        email,
        goals,
        notes,
        source: "manual" as const,
        status: "active" as const,
      })),
    );
  }

  let packages = 0;
  for (const { id, package: pkg } of toCreate) {
    if (!pkg) continue;
    await sellPackage(tx, trainer.id, {
      clientId: id,
      templateId: null,
      name: pkg.name,
      sessionType: "private",
      totalSessions: pkg.totalSessions,
      startsOn: today,
      expiresOn: pkg.expiresOn,
      // What is still owed becomes the package price, with nothing paid yet.
      price: pkg.price,
      makeupAllowance: 0,
      installments: 1,
      payment: null,
    });
    packages++;
  }

  const summary = summarize(results);
  return {
    created: summary.ok,
    packages,
    skipped: results.filter((r) => r.status !== "ok").map(({ line, status, reasons }) => ({ line, status, reasons })),
  };
}
