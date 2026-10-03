"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { addMemberWithoutLogin, createInvite, getMemberRow, renewInvite, revokeInvite, setMemberActive, setMemberPermission, updateMember } from "@/db/team";
import { isPermission } from "@/lib/permissions";
import { accountMembers, trainers, type PayRule } from "@/db/schema";
import { fieldErrors, parseTRY, readForm, type FormState } from "@/lib/forms";
import { isTeamColor, TEAM_COLORS } from "@/lib/team";
import { PROFILE_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { sendInviteMail } from "@/lib/team-mail";

// Ayarlar → Ekip: everything here is the owner's. RLS already refuses an
// instructor (account_invites and other members' rows are owner-only); the
// explicit check gives a clear answer instead of a silent no-op.

type Result = { ok: true } | { ok: false; error: string };
const NOT_OWNER = "Bunu sadece stüdyonun sahibi yapabilir.";
const FAIL = "Kaydedilemedi, tekrar dene.";

const studioName = (t: { businessName: string | null; fullName: string }) => t.businessName?.trim() || t.fullName;

const inviteSchema = z.object({
  fullName: z.string().trim().min(2, "Eğitmenin adını yaz.").max(120),
  // Optional: without it the instructor is added without a login.
  email: z.union([z.literal(""), z.string().trim().toLowerCase().email("Geçerli bir e-posta yaz.")]),
  color: z.string().refine((c) => c === "" || isTeamColor(c), "Listeden bir renk seç."),
});
const INVITE_FIELDS = ["fullName", "email", "color"] as const;

export async function inviteAction(
  _prev: FormState<(typeof INVITE_FIELDS)[number] | "form"> & { invited?: boolean },
  formData: FormData,
): Promise<FormState<(typeof INVITE_FIELDS)[number] | "form"> & { invited?: boolean }> {
  const values = readForm(formData, INVITE_FIELDS);
  const parsed = inviteSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const color = isTeamColor(parsed.data.color) ? parsed.data.color : null;

  if (!parsed.data.email) {
    const ok = await withTrainer(async (tx, trainerId, member) => {
      if (member.role !== "owner") return false;
      await addMemberWithoutLogin(tx, trainerId, { fullName: parsed.data.fullName, color });
      return true;
    });
    if (!ok) return { errors: { form: NOT_OWNER }, values };
    revalidatePath("/", "layout");
    return { savedAt: Date.now(), invited: false };
  }

  const out = await withTrainer(async (tx, trainerId, member) => {
    if (member.role !== "owner") return { error: NOT_OWNER } as const;
    const res = await createInvite(tx, trainerId, { ...parsed.data, color });
    if (!res.ok) return { error: res.reason === "member" ? "Bu e-posta zaten ekipte." : "Bu e-postaya gönderilmiş bir davet var; listeden yeniden gönderebilirsin." } as const;
    return { token: res.token, studio: studioName(await getTrainer(tx, trainerId)) } as const;
  });
  if ("error" in out) return { errors: { form: out.error }, values };
  const sent = await sendInviteMail({ to: parsed.data.email, name: parsed.data.fullName, studio: out.studio, token: out.token });
  revalidatePath("/ayarlar/ekip");
  if (!sent) return { errors: { form: "Davet oluşturuldu ama e-posta gönderilemedi. Listeden yeniden göndermeyi dene." } };
  return { savedAt: Date.now(), invited: true };
}

/** Owner: a login for an instructor already on the team (added without one). */
export async function inviteMemberAction(memberId: string, _prev: { error?: string; sentAt?: number }, formData: FormData): Promise<{ error?: string; sentAt?: number }> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email")?.toString() ?? "");
  if (!email.success) return { error: "Geçerli bir e-posta yaz." };
  if (!z.uuid().safeParse(memberId).success) return { error: FAIL };
  const out = await withTrainer(async (tx, trainerId, member) => {
    if (member.role !== "owner") return { error: NOT_OWNER } as const;
    const row = await getMemberRow(tx, trainerId, memberId);
    if (!row || row.userId || row.role !== "instructor") return { error: FAIL } as const;
    const res = await createInvite(tx, trainerId, { email: email.data, fullName: row.fullName, color: isTeamColor(row.color) ? row.color : null, memberId });
    if (!res.ok) return { error: res.reason === "member" ? "Bu e-posta zaten ekipte." : "Bu e-postaya gönderilmiş bir davet var; Ekip sayfasından yeniden gönderebilirsin." } as const;
    return { token: res.token, name: row.fullName, studio: studioName(await getTrainer(tx, trainerId)) } as const;
  });
  if ("error" in out) return { error: out.error };
  const sent = await sendInviteMail({ to: email.data, name: out.name, studio: out.studio, token: out.token });
  revalidatePath("/ayarlar/ekip", "layout");
  return sent ? { sentAt: Date.now() } : { error: "Davet oluşturuldu ama e-posta gönderilemedi. Ekip sayfasından yeniden göndermeyi dene." };
}

export async function resendInviteAction(id: string): Promise<Result> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: FAIL };
  const out = await withTrainer(async (tx, trainerId, member) => {
    if (member.role !== "owner") return null;
    const invite = await renewInvite(tx, trainerId, id);
    return invite ? { ...invite, studio: studioName(await getTrainer(tx, trainerId)) } : null;
  });
  if (!out) return { ok: false, error: FAIL };
  const sent = await sendInviteMail({ to: out.email, name: out.fullName, studio: out.studio, token: out.token });
  revalidatePath("/ayarlar/ekip");
  return sent ? { ok: true } : { ok: false, error: "E-posta gönderilemedi, biraz sonra tekrar dene." };
}

export async function revokeInviteAction(id: string): Promise<Result> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: FAIL };
  const ok = await withTrainer((tx, trainerId, member) => (member.role === "owner" ? revokeInvite(tx, trainerId, id) : Promise.resolve(false)));
  revalidatePath("/ayarlar/ekip");
  return ok ? { ok: true } : { ok: false, error: FAIL };
}

const amount = z.string().transform((v, ctx) => {
  const n = parseTRY(v);
  if (n === null) return 0;
  if (Number.isNaN(n) || n < 0 || n > 1_000_000) {
    ctx.addIssue({ code: "custom", message: "Geçerli bir tutar yaz." });
    return z.NEVER;
  }
  return n;
});

const memberSchema = z.discriminatedUnion("payType", [
  z.object({ payType: z.literal("none"), color: z.enum(TEAM_COLORS) }),
  z.object({ payType: z.literal("per_lesson"), color: z.enum(TEAM_COLORS), private: amount, duet: amount, trio: amount, group: amount }),
  z.object({
    payType: z.literal("percent"),
    color: z.enum(TEAM_COLORS),
    percent: z.coerce.number().min(1, "1 ile 100 arasında bir oran yaz.").max(100, "1 ile 100 arasında bir oran yaz."),
  }),
]);
const MEMBER_FIELDS = ["payType", "color", "private", "duet", "trio", "group", "percent"] as const;

export async function saveMemberAction(id: string, _prev: FormState<(typeof MEMBER_FIELDS)[number] | "form">, formData: FormData) {
  const values = readForm(formData, MEMBER_FIELDS);
  const parsed = memberSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const d = parsed.data;
  const payRule: PayRule | null =
    d.payType === "per_lesson"
      ? { type: "per_lesson", private: d.private, duet: d.duet, trio: d.trio, group: d.group }
      : d.payType === "percent"
        ? { type: "percent", percent: d.percent }
        : null;
  const ok = await withTrainer((tx, trainerId, member) =>
    member.role === "owner" ? updateMember(tx, trainerId, id, { color: d.color, payRule }) : Promise.resolve(false),
  );
  if (!ok) return { errors: { form: FAIL }, values };
  revalidatePath("/ayarlar/ekip");
  revalidatePath("/takvim");
  return { savedAt: Date.now() };
}

export async function setMemberActiveAction(id: string, active: boolean): Promise<Result> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: FAIL };
  const ok = await withTrainer((tx, trainerId, member) =>
    member.role === "owner" ? setMemberActive(tx, trainerId, id, active) : Promise.resolve(false),
  );
  revalidatePath("/ayarlar/ekip");
  return ok ? { ok: true } : { ok: false, error: FAIL };
}

export async function saveTeamSettingAction(name: "payrollCountsMissed", on: boolean): Promise<Result> {
  if (name !== "payrollCountsMissed") return { ok: false, error: FAIL };
  const ok = await withTrainer(async (tx, trainerId, member) => {
    if (member.role !== "owner") return false;
    await tx.update(trainers).set({ [name]: Boolean(on) }).where(eq(trainers.id, trainerId));
    return true;
  });
  if (!ok) return { ok: false, error: NOT_OWNER };
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Owner: an instructor's photo, uploaded into the owner's own storage folder
 * (storage RLS only lets a user write to theirs) as member-<id>-<time>.webp.
 */
export async function setMemberPhotoByOwnerAction(memberId: string, path: string | null): Promise<{ ok: boolean }> {
  if (!z.uuid().safeParse(memberId).success) return { ok: false };
  const previous = await withTrainer(async (tx, trainerId, member) => {
    if (member.role !== "owner") return undefined;
    if (path !== null && !new RegExp(`^${member.userId}/member-${memberId}-\\d+\\.webp$`).test(path)) return undefined;
    const row = await getMemberRow(tx, trainerId, memberId);
    if (!row) return undefined;
    await tx.update(accountMembers).set({ photoPath: path, updatedAt: new Date() }).where(eq(accountMembers.id, memberId));
    return { old: row.photoPath, mine: member.userId };
  });
  if (previous === undefined) return { ok: false };
  // Only files in the owner's own folder can be removed from here.
  if (previous.old && previous.old !== path && previous.old.startsWith(`${previous.mine}/`)) {
    const supabase = await createClient();
    await supabase.storage.from(PROFILE_BUCKET).remove([previous.old]);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Owner: one thing an instructor may or may not do (src/lib/permissions.ts). */
export async function setMemberPermissionAction(memberId: string, key: string, on: boolean): Promise<Result> {
  if (!z.uuid().safeParse(memberId).success || !isPermission(key)) return { ok: false, error: FAIL };
  const ok = await withTrainer((tx, trainerId, member) =>
    member.role === "owner" ? setMemberPermission(tx, trainerId, memberId, key, Boolean(on)) : Promise.resolve(false),
  );
  revalidatePath("/", "layout");
  return ok ? { ok: true } : { ok: false, error: FAIL };
}
