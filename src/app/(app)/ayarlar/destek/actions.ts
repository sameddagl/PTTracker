"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import { getClaims, withTrainer } from "@/db";
import type { Message } from "@/db/messages";
import { cleanSupportBody, markSupportReadByTrainer, sendTrainerSupport, trainerSupportMessages } from "@/db/support";
import { getTrainer } from "@/db/queries";
import { mailTeamAboutSupport } from "@/lib/support-mail";

export async function sendSupportAction(body: string): Promise<{ ok: true; message: Message } | { ok: false; error: string }> {
  const text = cleanSupportBody(body);
  if (!text) return { ok: false, error: "Mesaj boş olamaz, en fazla 4000 karakter olabilir." };
  const out = await withTrainer(async (tx, trainerId) => {
    const { message, threadId } = await sendTrainerSupport(tx, trainerId, text);
    const trainer = await getTrainer(tx, trainerId);
    return { message, threadId, name: trainer.businessName || trainer.fullName || "Eğitmen" };
  });
  const claims = await getClaims();
  after(() =>
    mailTeamAboutSupport({ threadId: out.threadId, from: out.name, contact: (claims?.email as string | undefined) ?? null, body: text, source: "app" }),
  );
  return { ok: true, message: out.message };
}

export async function fetchSupportAction(): Promise<Message[] | null> {
  return withTrainer((tx, trainerId) => trainerSupportMessages(tx, trainerId));
}

export async function markSupportReadAction(): Promise<{ ok: boolean }> {
  const changed = await withTrainer((tx, trainerId) => markSupportReadByTrainer(tx, trainerId));
  if (changed > 0) refresh();
  return { ok: true };
}
