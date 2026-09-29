"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { authUsers } from "drizzle-orm/supabase";
import { z } from "zod";
import { adminDb, type Tx } from "@/db";
import { bookSlot, cancelBooking } from "@/db/booking";
import { clients, trainers } from "@/db/schema";
import { siteUrl } from "@/lib/config";
import { dayLong } from "@/lib/dates";
import { formatLongDate, formatTime } from "@/lib/format";
import { layout, sendMail } from "@/lib/mail";
import { resolvePortalToken } from "@/lib/portal";
import { toHHMM } from "@/lib/slots";

async function notifyTrainer(clientId: string, heading: string, line: string) {
  const [who] = await adminDb
    .select({ name: clients.fullName, email: authUsers.email })
    .from(clients)
    .innerJoin(authUsers, eq(authUsers.id, clients.trainerId))
    .where(eq(clients.id, clientId));
  if (!who?.email) return;
  const { html, text } = layout({ heading, lines: [`${who.name} ${line}`], cta: { label: "Takvimi aç", url: `${siteUrl()}/takvim` } });
  await sendMail({ to: who.email, subject: `${heading}: ${who.name}`, html, text });
}

const bookInput = z.object({ date: z.iso.date(), minute: z.number().int().min(0).max(1439) });

export async function bookSlotAction(token: string, date: string, minute: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const link = await resolvePortalToken(token);
  const parsed = bookInput.safeParse({ date, minute });
  if (!link || !parsed.success) return { ok: false, error: "Geçersiz istek." };

  const result = await adminDb.transaction((tx) => bookSlot(tx as unknown as Tx, link, parsed.data));
  if (!result.ok) {
    return {
      ok: false,
      error: {
        disabled: "Eğitmenin şu an randevu almıyor.",
        no_credit: "Paketinde randevu alınabilecek ders kalmadı.",
        slot_taken: "Bu saat az önce doldu. Başka bir saat seç.",
      }[result.reason],
    };
  }

  const when = `${dayLong(parsed.data.date)} ${toHHMM(parsed.data.minute)}`;
  await notifyTrainer(link.clientId, "Yeni randevu", `${when} için randevu aldı (${result.packageName}).`);
  revalidatePath(`/p/${token}`);
  return { ok: true };
}

export async function cancelBookingAction(
  token: string,
  attendeeId: string,
  confirmLate: boolean,
): Promise<{ ok: true; late: boolean; makeupUsed: boolean } | { ok: false; error: string; needsConfirm?: boolean }> {
  const link = await resolvePortalToken(token);
  if (!link || !z.uuid().safeParse(attendeeId).success) return { ok: false, error: "Geçersiz istek." };

  const result = await adminDb.transaction((tx) => cancelBooking(tx as unknown as Tx, link, attendeeId, { confirmLate }));
  if (!result.ok) {
    if (result.reason === "confirm_late") return { ok: false, error: "", needsConfirm: true };
    return { ok: false, error: result.reason === "past" ? "Bu ders başladı ya da geçti." : "Ders bulunamadı." };
  }

  const [trainer] = await adminDb.select({ tz: trainers.timezone }).from(trainers).where(eq(trainers.id, link.trainerId));
  const tz = trainer?.tz ?? "Europe/Istanbul";
  await notifyTrainer(
    link.clientId,
    result.late ? "Geç iptal" : "Randevu iptali",
    `${formatLongDate(result.startsAt, tz)} ${formatTime(result.startsAt, tz)} dersini iptal etti${result.late ? (result.makeupUsed ? " (telafi hakkı kullanıldı)" : " (ders paketten düştü)") : ""}.`,
  );
  revalidatePath(`/p/${token}`);
  return { ok: true, late: result.late, makeupUsed: result.makeupUsed };
}
