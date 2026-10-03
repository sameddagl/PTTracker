"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOwner, withTrainer } from "@/db";
import { addGroupMember, createGroupClass, endGroupClass, removeGroupMember, updateGroupClass } from "@/db/groups";
import { getTrainer } from "@/db/queries";
import { fieldErrors, type FormState } from "@/lib/forms";

export type GroupField = "title" | "weekdays" | "startTime" | "durationMinutes" | "capacity" | "joinMode" | "startsOn" | "form";
export type GroupFormState = FormState<GroupField>;

const joinMode = z.enum(["drop_in", "fixed", "both"], { error: "Katılım şeklini seç." });
const capacity = z.coerce.number({ error: "Kapasite 1 ile 100 arasında olmalı." }).int().min(1, "Kapasite 1 ile 100 arasında olmalı.").max(100, "Kapasite 1 ile 100 arasında olmalı.");
const title = z.string().trim().min(2, "Ders adı en az 2 karakter olmalı.").max(60);

const createSchema = z.object({
  title,
  weekdays: z.array(z.coerce.number().int().min(1).max(7)).min(1, "En az bir gün seç."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Saat seç." }),
  durationMinutes: z.coerce.number().int().min(15, "Süre 15 ile 240 dakika arasında olmalı.").max(240, "Süre 15 ile 240 dakika arasında olmalı."),
  capacity,
  joinMode,
  startsOn: z.iso.date({ error: "Başlangıç tarihi seç." }),
});

const rawOf = (formData: FormData) => ({
  title: formData.get("title")?.toString() ?? "",
  weekdays: formData.getAll("weekdays").map(String),
  startTime: formData.get("startTime")?.toString() ?? "",
  durationMinutes: formData.get("durationMinutes")?.toString() ?? "",
  capacity: formData.get("capacity")?.toString() ?? "",
  joinMode: formData.get("joinMode")?.toString() ?? "",
  startsOn: formData.get("startsOn")?.toString() ?? "",
});

const echo = (raw: ReturnType<typeof rawOf>) => ({ ...raw, weekdays: raw.weekdays.join(",") });

export async function createGroupAction(_prev: GroupFormState, formData: FormData): Promise<GroupFormState> {
  await requireOwner();
  const raw = rawOf(formData);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: echo(raw) };
  const id = await withTrainer(async (tx, trainerId) => createGroupClass(tx, await getTrainer(tx, trainerId), parsed.data));
  revalidatePath("/takvim", "layout");
  redirect(`/takvim/grup/${id}`);
}

const updateSchema = z.object({ title, capacity, joinMode });

export async function updateGroupAction(id: string, _prev: GroupFormState, formData: FormData): Promise<GroupFormState> {
  await requireOwner();
  const raw = rawOf(formData);
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: echo(raw) };
  const res = await withTrainer(async (tx, trainerId) => updateGroupClass(tx, await getTrainer(tx, trainerId), id, parsed.data));
  if (!res.ok) {
    return {
      errors:
        res.reason === "below_members"
          ? { capacity: `${res.members} sabit üye var; kapasite bundan az olamaz.` }
          : { form: "Grup dersi bulunamadı." },
      values: echo(raw),
    };
  }
  revalidatePath("/takvim", "layout");
  return { savedAt: Date.now() };
}

export async function endGroupAction(id: string) {
  await requireOwner();
  await withTrainer(async (tx, trainerId) => endGroupClass(tx, await getTrainer(tx, trainerId), id));
  revalidatePath("/takvim", "layout");
}

export async function addMemberAction(classId: string, clientId: string, startsOn: string): Promise<{ ok: true; skipped: number } | { ok: false; error: string }> {
  await requireOwner();
  if (!z.uuid().safeParse(clientId).success || !z.iso.date().safeParse(startsOn).success) return { ok: false, error: "Danışan ve tarih seç." };
  const res = await withTrainer(async (tx, trainerId) => addGroupMember(tx, await getTrainer(tx, trainerId), { classId, clientId, startsOn }));
  if (!res.ok) {
    return {
      ok: false,
      error: {
        full: "Sabit yerler dolu. Kapasiteyi artırabilirsin.",
        already: "Bu danışanın zaten sabit yeri var.",
        not_found: "Grup dersi bulunamadı.",
        drop_in_only: "Bu derste sabit yer yok; danışanlar derslere tek tek yazılıyor.",
      }[res.reason],
    };
  }
  revalidatePath("/takvim", "layout");
  return res;
}

export async function removeMemberAction(memberId: string) {
  await requireOwner();
  await withTrainer(async (tx, trainerId) => removeGroupMember(tx, await getTrainer(tx, trainerId), memberId));
  revalidatePath("/takvim", "layout");
}
