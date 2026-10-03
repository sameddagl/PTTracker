"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb, type Tx } from "@/db";
import { bookSlot, cancelBooking } from "@/db/booking";
import { confirmAttendance } from "@/db/engagement";
import { joinGroupLesson } from "@/db/groups";
import { clients, trainers } from "@/db/schema";
import { dayLong } from "@/lib/dates";
import { formatLongDate, formatTime } from "@/lib/format";
import { notifyTrainer as tellTrainer, type NotifyAbout } from "@/lib/notify";
import { resolvePortalToken } from "@/lib/portal";
import { toHHMM } from "@/lib/slots";

async function notifyTrainer(clientId: string, heading: string, line: string, about: NotifyAbout = {}) {
  const [who] = await adminDb.select({ name: clients.fullName, trainerId: clients.trainerId }).from(clients).where(eq(clients.id, clientId));
  if (!who) return;
  await tellTrainer(who.trainerId, "booking", {
    title: `${heading}: ${who.name}`,
    body: `${who.name} ${line}`,
    path: "/takvim",
    email: { subject: `${heading}: ${who.name}`, heading, lines: [`${who.name} ${line}`], cta: "Takvimi aç" },
  }, { clientId, ...about });
}

const bookInput = z.object({ date: z.iso.date(), minute: z.number().int().min(0).max(1439), instructorId: z.uuid().nullable() });

/** Books a private lesson; in a studio with `instructorId` (null: whoever is free). */
export async function bookSlotAction(token: string, date: string, minute: number, instructorId: string | null = null): Promise<{ ok: true } | { ok: false; error: string }> {
  const link = await resolvePortalToken(token);
  const parsed = bookInput.safeParse({ date, minute, instructorId });
  if (!link || !parsed.success) return { ok: false, error: "Bir sorun oldu. Sayfayı yenileyip tekrar dene." };

  const result = await adminDb.transaction((tx) => bookSlot(tx as unknown as Tx, link, parsed.data));
  if (!result.ok) {
    return {
      ok: false,
      error: {
        disabled: "Eğitmenin şu an randevu almıyor.",
        no_credit: "Paketinde ders hakkın kalmadı.",
        slot_taken: "Bu saat az önce doldu. Başka bir saat seç.",
      }[result.reason],
    };
  }

  const when = `${dayLong(parsed.data.date)} ${toHHMM(parsed.data.minute)}`;
  await notifyTrainer(link.clientId, "Yeni randevu", `${when} için randevu aldı (${result.packageName}).`, { lessonId: result.lessonId });
  revalidatePath(`/p/${token}`);
  return { ok: true };
}

export async function cancelBookingAction(
  token: string,
  attendeeId: string,
  confirmLate: boolean,
): Promise<{ ok: true; late: boolean; makeupUsed: boolean } | { ok: false; error: string; needsConfirm?: boolean }> {
  const link = await resolvePortalToken(token);
  if (!link || !z.uuid().safeParse(attendeeId).success) return { ok: false, error: "Bir sorun oldu. Sayfayı yenileyip tekrar dene." };

  const result = await adminDb.transaction((tx) => cancelBooking(tx as unknown as Tx, link, attendeeId, { confirmLate }));
  if (!result.ok) {
    if (result.reason === "confirm_late") return { ok: false, error: "", needsConfirm: true };
    return { ok: false, error: result.reason === "past" ? "Bu ders başladı ya da bitti." : "Ders bulunamadı." };
  }

  const [trainer] = await adminDb.select({ tz: trainers.timezone }).from(trainers).where(eq(trainers.id, link.trainerId));
  const tz = trainer?.tz ?? "Europe/Istanbul";
  await notifyTrainer(
    link.clientId,
    result.late ? "Geç iptal" : "Randevu iptali",
    `${formatLongDate(result.startsAt, tz)} ${formatTime(result.startsAt, tz)} dersini iptal etti${result.late ? (result.makeupUsed ? " (telafi hakkını kullandı)" : " (ders paketten düştü)") : ""}.`,
    { attendeeId },
  );
  revalidatePath(`/p/${token}`);
  return { ok: true, late: result.late, makeupUsed: result.makeupUsed };
}

export async function joinGroupAction(token: string, lessonId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const link = await resolvePortalToken(token);
  if (!link || !z.uuid().safeParse(lessonId).success) return { ok: false, error: "Bir sorun oldu. Sayfayı yenileyip tekrar dene." };

  const result = await adminDb.transaction((tx) => joinGroupLesson(tx as unknown as Tx, link, lessonId));
  if (!result.ok) {
    return {
      ok: false,
      error: {
        not_found: "Ders bulunamadı.",
        full: "Bu ders az önce doldu.",
        no_credit: "Grup paketinde ders hakkın kalmadı.",
        already: "Bu derste zaten yerin var.",
        too_late: "Bu ders için kayıt süresi doldu.",
      }[result.reason],
    };
  }

  const [trainer] = await adminDb.select({ tz: trainers.timezone }).from(trainers).where(eq(trainers.id, link.trainerId));
  const tz = trainer?.tz ?? "Europe/Istanbul";
  await notifyTrainer(link.clientId, "Grup dersine kayıt", `${formatLongDate(result.startsAt, tz)} ${formatTime(result.startsAt, tz)} ${result.title} dersine yazıldı.`);
  revalidatePath(`/p/${token}`);
  return { ok: true };
}

/** "Geliyorum" on an upcoming lesson. */
export async function confirmAttendanceAction(token: string, attendeeId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const link = await resolvePortalToken(token);
  if (!link || !z.uuid().safeParse(attendeeId).success) return { ok: false, error: "Bir sorun oldu. Sayfayı yenileyip tekrar dene." };
  const done = await adminDb.transaction((tx) => confirmAttendance(tx as unknown as Tx, link, attendeeId));
  if (!done) return { ok: false, error: "Bu dersi artık onaylayamazsın." };
  revalidatePath(`/p/${token}`);
  return { ok: true };
}
