"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { authUsers } from "drizzle-orm/supabase";
import { adminDb } from "@/db";
import { siteUrl } from "@/lib/config";
import { formatTRY } from "@/lib/format";
import { pickOption } from "@/lib/pricing";
import { layout, sendMail } from "@/lib/mail";
import { portalUrl } from "@/lib/portal";
import { getPublicPage } from "@/lib/public-page";
import { submitSignup, type SignupErrors } from "@/lib/signup";

export type SignupState = { errors?: SignupErrors };

export async function signupAction(slug: string, _prev: SignupState, formData: FormData): Promise<SignupState> {
  const result = await submitSignup(slug, formData);
  if (!result.ok) return { errors: result.errors };

  const page = await getPublicPage(slug);
  const pkg = page?.packages.find((p) => p.id === formData.get("templateId"));
  const trainerName = page ? page.trainer.businessName || page.trainer.fullName : "";
  const option = pkg ? pickOption(pkg, Number(formData.get("installments") || 1)) : null;
  const priceNote = option ? ` (${option.installments > 1 ? `${option.installments} taksit, ` : "peşin "}${formatTRY(option.total)})` : "";
  const clientName = `${formData.get("firstName")} ${formData.get("lastName")}`.trim();
  const url = portalUrl(result.token);

  // Emails are best-effort: a failure is logged and never blocks the sign-up.
  if (result.email) {
    const { html, text } = layout({
      heading: "Başvurun alındı",
      lines: [
        `${trainerName} için ${pkg?.name ?? "paket"} başvurun iletildi. Eğitmenin onayladığında sana haber vereceğiz.`,
        "Kalan derslerini, randevularını ve ödeme bilgilerini bu linkten takip edebilirsin. Linki kaydet, başkasıyla paylaşma.",
      ],
      cta: { label: "Sayfamı aç", url },
      footer: trainerName,
    });
    await sendMail({ to: result.email, subject: `${trainerName} · Başvurun alındı`, html, text });
  }

  if (page) {
    const [trainerUser] = await adminDb.select({ email: authUsers.email }).from(authUsers).where(eq(authUsers.id, page.trainer.id));
    if (trainerUser?.email) {
      const { html, text } = layout({
        heading: "Yeni başvuru",
        lines: [
          `${clientName}, ${pkg?.name ?? "bir paket"}${priceNote} için başvurdu.`,
          "Bilgilerine bakıp onaylayabilir ya da reddedebilirsin.",
        ],
        cta: { label: "Başvuruyu gör", url: `${siteUrl()}/danisanlar/basvurular` },
      });
      await sendMail({ to: trainerUser.email, subject: `Yeni başvuru: ${clientName}`, html, text });
    }
  }

  redirect(`/p/${result.token}?yeni=1`);
}
