"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner, withTrainer } from "@/db";
import { existingPhones, importClients, type ImportResult } from "@/db/import";
import { getTrainer } from "@/db/queries";
import { todayISO } from "@/lib/format";
import { IMPORT_FIELDS, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, detectMapping, phonesInFile, type ColumnMapping } from "@/lib/import/clients";
import { SpreadsheetError, readSpreadsheet, uploadKind } from "@/lib/import/spreadsheet";

export type ParsedFile = {
  name: string;
  headers: string[];
  rows: string[][];
  lines: number[];
  mapping: ColumnMapping;
  /** Phones in the file that already belong to a client. */
  existingPhones: string[];
  /** Today in the trainer's timezone. */
  today: string;
};

export type ReadFileState = { error?: string; file?: ParsedFile };

/** Step 1: reads the upload and guesses the columns. Nothing is saved. */
export async function readImportFileAction(_prev: ReadFileState, formData: FormData): Promise<ReadFileState> {
  await requireOwner();
  // Signed-in check (and the data we need) before touching the upload.
  const { known, today } = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    return { known: await existingPhones(tx, trainerId), today: todayISO(trainer.timezone) };
  });

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Bir dosya seç." };
  if (file.size > MAX_IMPORT_BYTES) return { error: "Dosya en fazla 2 MB olabilir." };
  const kind = uploadKind(file.name, file.type);
  if (!kind) return { error: ".xlsx ya da .csv dosyası yükle. Eski bir .xls dosyasıysa Excel'de .xlsx olarak kaydedip tekrar dene." };

  let sheet;
  try {
    sheet = await readSpreadsheet(await file.arrayBuffer(), kind);
  } catch (e) {
    if (e instanceof SpreadsheetError) return { error: e.message };
    throw e;
  }
  if (sheet.rows.length === 0) return { error: "Başlık satırının altında danışan yok." };
  if (sheet.rows.length > MAX_IMPORT_ROWS) {
    return { error: `Dosyada ${sheet.rows.length} satır var. Bir seferde en fazla ${MAX_IMPORT_ROWS} danışan aktarabilirsin; dosyayı bölüp tekrar dene.` };
  }

  const inFile = phonesInFile(sheet.rows);

  return {
    file: {
      name: file.name,
      ...sheet,
      mapping: detectMapping(sheet.headers),
      existingPhones: [...inFile].filter((p) => known.has(p)),
      today,
    },
  };
}

const column = z.number().int().min(0).max(39);

const importSchema = z.object({
  rows: z.array(z.array(z.string().max(2000)).max(40)).min(1).max(MAX_IMPORT_ROWS),
  lines: z.array(z.number().int().positive()).max(MAX_IMPORT_ROWS),
  /** Header of each sent column, used to label joined health notes. */
  headers: z.array(z.string().max(200)).max(40),
  mapping: z.object({
    ...(Object.fromEntries(IMPORT_FIELDS.map((f) => [f, column.nullable()])) as Record<(typeof IMPORT_FIELDS)[number], z.ZodNullable<typeof column>>),
    healthNotes: z.array(column).max(40),
  }),
});

export type ImportInput = z.input<typeof importSchema>;
export type ImportState = { error?: string; result?: ImportResult };

/** Step 2: creates the clients and packages, all or nothing. */
export async function importClientsAction(input: ImportInput): Promise<ImportState> {
  await requireOwner();
  const parsed = importSchema.safeParse(input);
  if (!parsed.success) return { error: "Dosya okunamadı. Dosyayı yeniden yükle." };
  const { rows, lines, headers, mapping } = parsed.data;
  if (mapping.fullName === null && mapping.firstName === null) return { error: "Ad soyad sütununu seç." };

  const result = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    return importClients(tx, trainer, rows, mapping, { lines, headers });
  });
  if (result.created > 0) revalidatePath("/", "layout");
  return { result };
}
