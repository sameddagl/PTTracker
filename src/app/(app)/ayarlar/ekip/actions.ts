"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { createInvite, renewInvite, revokeInvite, setMemberActive, updateMember } from "@/db/team";
import { trainers, type PayRule } from "@/db/schema";
import { fieldErrors, parseTRY, readForm, type FormState } from "@/lib/forms";
import { isTeamColor, TEAM_COLORS } from "@/lib/team";
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
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta yaz."),
  color: z.string().refine((c) => c === "" || isTeamColor(c), "Listeden bir renk seç."),
});
const INVITE_FIELDS = ["fullName", "email", "color"] as const;

export async function inviteAction(_prev: FormState<(typeof INVITE_FIELDS)[number] | "form">, formData: FormData) {
  const values = readForm(formData, INVITE_FIELDS);
  const parsed = inviteSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const out = await withTrainer(async (tx, trainerId, member) => {
    if (member.role !== "owner") return { error: NOT_OWNER } as const;
    const res = await createInvite(tx, trainerId, { ...parsed.data, color: isTeamColor(parsed.data.color) ? parsed.data.color : null });
    if (!res.ok) return { error: res.reason === "member" ? "Bu e-posta zaten ekipte." : "Bu e-postaya gönderilmiş bir davet var; listeden yeniden gönderebilirsin." } as const;
    return { token: res.token, studio: studioName(await getTrainer(tx, trainerId)) } as const;
  });
  if ("error" in out) return { errors: { form: out.error }, values };
  const sent = await sendInviteMail({ to: parsed.data.email, name: parsed.data.fullName, studio: out.studio, token: out.token });
  revalidatePath("/ayarlar/ekip");
  if (!sent) return { errors: { form: "Davet oluşturuldu ama e-posta gönderilemedi. Listeden yeniden göndermeyi dene." } };
  return { savedAt: Date.now() };
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

export async function saveTeamSettingAction(name: "instructorsSeeAllClients" | "payrollCountsMissed", on: boolean): Promise<Result> {
  if (name !== "instructorsSeeAllClients" && name !== "payrollCountsMissed") return { ok: false, error: FAIL };
  const ok = await withTrainer(async (tx, trainerId, member) => {
    if (member.role !== "owner") return false;
    await tx.update(trainers).set({ [name]: Boolean(on) }).where(eq(trainers.id, trainerId));
    return true;
  });
  if (!ok) return { ok: false, error: NOT_OWNER };
  revalidatePath("/", "layout");
  return { ok: true };
}
