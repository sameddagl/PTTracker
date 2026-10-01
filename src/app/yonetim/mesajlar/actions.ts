"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb, getClaims, type Tx } from "@/db";
import { addAdminReply, adminThread, cleanSupportBody, setThreadClosed } from "@/db/support";
import { isAdminEmail } from "@/lib/admin";
import { APP_NAME, siteUrl } from "@/lib/config";
import { LEGAL } from "@/lib/legal";
import { layout, sendMail } from "@/lib/mail";
import { notifyTrainer } from "@/lib/notify";

type Result = { ok: true; emailed?: boolean } | { ok: false; error: string };
const FAIL = "Bir sorun oldu.";

async function asOwner() {
  const claims = await getClaims();
  return isAdminEmail(claims?.email as string | undefined);
}

/**
 * Answers a thread. A trainer reads it in the app (and gets a push); someone
 * who wrote from the landing gets it by e-mail, since they have no account.
 */
export async function replySupportAction(threadId: string, body: string): Promise<Result> {
  if (!(await asOwner())) return { ok: false, error: FAIL };
  const text = cleanSupportBody(body);
  if (!z.uuid().safeParse(threadId).success || !text) return { ok: false, error: "Cevap boş olamaz." };
  const db = adminDb as unknown as Tx;
  const found = await adminThread(db, threadId);
  if (!found) return { ok: false, error: FAIL };
  await addAdminReply(db, threadId, text);

  let emailed = false;
  const { thread } = found;
  if (thread.trainerId) {
    await notifyTrainer(thread.trainerId, "message", { title: `${APP_NAME} ekibi`, body: text.length > 140 ? `${text.slice(0, 139)}…` : text, path: "/ayarlar/destek", tag: "support" });
  } else if (thread.email) {
    const last = found.messages.filter((m) => m.sender === "user").at(-1);
    const { html, text: plain } = layout({
      heading: `Merhaba ${thread.name.split(" ")[0]},`,
      lines: [...text.split(/\n{2,}/), ...(last ? [`— Yazdığınız mesaj: “${last.body.length > 300 ? `${last.body.slice(0, 299)}…` : last.body}”`] : [])],
      cta: { label: `${APP_NAME}'a göz atın`, url: siteUrl() },
      footer: `Bu e-postayı yanıtlayarak ya da ${LEGAL.email} adresine yazarak devam edebilirsiniz.`,
    });
    emailed = await sendMail({ to: thread.email, subject: `${APP_NAME} · Mesajınıza cevap`, html, text: plain });
  }
  revalidatePath(`/yonetim/mesajlar/${threadId}`);
  revalidatePath("/yonetim/mesajlar");
  return { ok: true, emailed };
}

export async function closeSupportAction(threadId: string, closed: boolean): Promise<Result> {
  if (!(await asOwner()) || !z.uuid().safeParse(threadId).success) return { ok: false, error: FAIL };
  await setThreadClosed(adminDb as unknown as Tx, threadId, closed);
  revalidatePath("/yonetim/mesajlar");
  revalidatePath(`/yonetim/mesajlar/${threadId}`);
  return { ok: true };
}
