"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { withTrainer } from "@/db";
import { approveApplication, getApplication, rejectApplication } from "@/db/applications";
import { createPortalLink, getActivePortalLink } from "@/db/portal";
import { getTrainer } from "@/db/queries";
import { layout, sendMail } from "@/lib/mail";
import { portalUrl } from "@/lib/portal";

export type DecisionState = { error?: string };

function revalidateAll(clientId: string) {
  revalidatePath("/danisanlar", "layout");
  revalidatePath("/bugun");
  revalidatePath(`/danisanlar/${clientId}`);
}

export async function approveApplicationAction(_prev: DecisionState, formData: FormData): Promise<DecisionState> {
  const id = z.uuid().safeParse(formData.get("id"));
  const startsOn = z.iso.date().safeParse(formData.get("startsOn"));
  if (!id.success || !startsOn.success) return { error: "Başlangıç tarihi seç." };

  const result = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    const approved = await approveApplication(tx, trainer, id.data, { startsOn: startsOn.data });
    if (!approved) return null;
    const app = await getApplication(tx, trainerId, id.data);
    const link = (await getActivePortalLink(tx, approved.clientId)) ?? (await createPortalLink(tx, trainerId, approved.clientId));
    return { app: app!, trainerName: trainer.businessName || trainer.fullName, token: link.token };
  });
  if (!result) return { error: "Başvuru bulunamadı ya da zaten karara bağlanmış." };

  const { app, trainerName, token } = result;
  let emailed = false;
  if (app.clientEmail) {
    const { html, text } = layout({
      heading: "Başvurun onaylandı 🎉",
      lines: [
        `${trainerName}, ${app.packageName} başvurunu onayladı.`,
        "Paket bilgilerini, ödeme adımlarını ve derslerini kişisel sayfandan takip edebilirsin.",
      ],
      cta: { label: "Sayfamı aç", url: portalUrl(token) },
      footer: trainerName,
    });
    emailed = await sendMail({ to: app.clientEmail, subject: `${trainerName} · Başvurun onaylandı`, html, text });
  }

  revalidateAll(app.clientId);
  redirect(`/danisanlar/basvurular/${id.data}?onaylandi=${emailed ? "eposta" : "1"}`);
}

export async function rejectApplicationAction(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const result = await withTrainer((tx, trainerId) => rejectApplication(tx, trainerId, id));
  if (result) revalidateAll(result.clientId);
  redirect("/danisanlar/basvurular");
}
