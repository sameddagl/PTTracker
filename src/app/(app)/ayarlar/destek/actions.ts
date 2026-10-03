"use server";

import { refresh } from "next/cache";
import { requireOwner, withTrainer } from "@/db";
import type { Message } from "@/db/messages";
import { cleanSupportBody, markSupportReadByTrainer, sendTrainerSupport, trainerSupportMessages } from "@/db/support";

export async function sendSupportAction(body: string): Promise<{ ok: true; message: Message } | { ok: false; error: string }> {
  await requireOwner();
  const text = cleanSupportBody(body);
  if (!text) return { ok: false, error: "Mesaj boş olamaz, en fazla 4000 karakter olabilir." };
  // No e-mail to the team: trainers' messages wait in /yonetim/mesajlar.
  const { message } = await withTrainer((tx, trainerId) => sendTrainerSupport(tx, trainerId, text));
  return { ok: true, message };
}

export async function fetchSupportAction(): Promise<Message[] | null> {
  await requireOwner();
  return withTrainer((tx, trainerId) => trainerSupportMessages(tx, trainerId));
}

export async function markSupportReadAction(): Promise<{ ok: boolean }> {
  await requireOwner();
  const changed = await withTrainer((tx, trainerId) => markSupportReadByTrainer(tx, trainerId));
  if (changed > 0) refresh();
  return { ok: true };
}
