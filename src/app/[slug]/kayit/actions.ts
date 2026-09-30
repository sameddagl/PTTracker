"use server";

import { redirect } from "next/navigation";
import { formatTRY } from "@/lib/format";
import { pickOption } from "@/lib/pricing";
import { layout, sendMail } from "@/lib/mail";
import { notifyTrainer } from "@/lib/notify";
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

  // Always sent: it carries the client's personal link. Best effort, never blocks the sign-up.
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
    await notifyTrainer(page.trainer.id, "application", {
      title: `Yeni başvuru: ${clientName}`,
      body: `${pkg?.name ?? "Bir paket"}${priceNote} için başvurdu.`,
      path: "/danisanlar/basvurular",
      email: {
        subject: `Yeni başvuru: ${clientName}`,
        heading: "Yeni başvuru",
        lines: [`${clientName}, ${pkg?.name ?? "bir paket"}${priceNote} için başvurdu.`, "Bilgilerine bakıp onaylayabilir ya da reddedebilirsin."],
        cta: "Başvuruyu gör",
      },
    });
  }

  redirect(`/p/${result.token}?yeni=1`);
}
