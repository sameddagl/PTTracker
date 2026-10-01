"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { adminDb, type Tx } from "@/db";
import { grantHealthConsent, saveMeasurements } from "@/db/progress";
import { trainers } from "@/db/schema";
import { isISODate } from "@/lib/dates";
import { todayISO } from "@/lib/format";
import { BUILTIN_METRICS, SELF_METRIC, parseMetricValue } from "@/lib/measurements";
import { resolvePortalToken } from "@/lib/portal";

// The client's "İlerlemem" tab: explicit consent to keep measurements, and
// logging their own weight when the trainer allows it.

type Result = { ok: true } | { ok: false; error: string };
const FAIL = "Bir sorun oldu. Sayfayı yenileyip tekrar dene.";

export async function grantHealthConsentAction(token: string): Promise<Result> {
  const who = await resolvePortalToken(token);
  if (!who) return { ok: false, error: FAIL };
  await adminDb.transaction((tx) => grantHealthConsent(tx as unknown as Tx, who));
  revalidatePath(`/p/${token}`);
  return { ok: true };
}

export async function logWeightAction(token: string, raw: string, measuredOn: string): Promise<Result> {
  const who = await resolvePortalToken(token);
  if (!who || typeof raw !== "string" || !isISODate(measuredOn)) return { ok: false, error: FAIL };
  const [t] = await adminDb.select({ selfWeigh: trainers.clientsSelfWeigh, tz: trainers.timezone }).from(trainers).where(eq(trainers.id, who.trainerId));
  if (!t?.selfWeigh) return { ok: false, error: "Eğitmenin bu sayfadan ölçüm girilmesini kapatmış." };
  if (measuredOn > todayISO(t.tz)) return { ok: false, error: "İleri bir tarih seçemezsin." };
  const def = BUILTIN_METRICS.find((m) => m.key === SELF_METRIC)!;
  const parsed = parseMetricValue(raw, def);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  if (parsed.value === null) return { ok: false, error: "Kilonu yaz." };
  const res = await adminDb.transaction((tx) => saveMeasurements(tx as unknown as Tx, who, measuredOn, [{ metric: SELF_METRIC, value: parsed.value! }], "client"));
  if (!res.ok) return { ok: false, error: res.reason === "consent" ? "Önce ölçümlerinin kaydedilmesine onay ver." : FAIL };
  revalidatePath(`/p/${token}`);
  return { ok: true };
}
