"use server";

import { eq } from "drizzle-orm";
import { after } from "next/server";
import { adminDb, type Tx } from "@/db";
import { type Message, getClientThread, markReadByClient, sendClientMessage } from "@/db/messages";
import { clients } from "@/db/schema";
import { notifyTrainer } from "@/lib/notify";
import { resolvePortalToken } from "@/lib/portal";

// The client's side of the chat. Every call re-resolves the token and scopes
// by the ids bound to it (adminDb, no RLS).

const ERRORS = {
  empty: "Boş mesaj gönderilemez.",
  too_long: "Mesaj en fazla 2000 karakter olabilir.",
  not_found: "Bu sayfadan şu an mesaj gönderilemiyor.",
  rate_limited: "Kısa sürede çok mesaj gönderdin. Birkaç dakika sonra tekrar dene.",
} as const;

const preview = (body: string) => (body.length > 140 ? `${body.slice(0, 139)}…` : body);

export async function sendClientMessageAction(token: string, body: string): Promise<{ ok: true; message: Message } | { ok: false; error: string }> {
  const who = await resolvePortalToken(token);
  if (!who || typeof body !== "string") return { ok: false, error: "Geçersiz istek." };

  const result = await adminDb.transaction((tx) => sendClientMessage(tx as unknown as Tx, who, body));
  if (!result.ok) return { ok: false, error: ERRORS[result.reason] };

  const { message } = result;
  // Messages never go by e-mail, only as a push when the trainer wants them.
  after(async () => {
    const [info] = await adminDb.select({ name: clients.fullName }).from(clients).where(eq(clients.id, who.clientId));
    if (!info) return;
    await notifyTrainer(who.trainerId, "message", {
      title: info.name,
      body: preview(message.body),
      path: `/mesajlar/${who.clientId}`,
      tag: `message-${who.clientId}`,
    });
  });
  return { ok: true, message };
}

export async function markReadByClientAction(token: string): Promise<{ ok: boolean }> {
  const who = await resolvePortalToken(token);
  if (!who) return { ok: false };
  await adminDb.transaction((tx) => markReadByClient(tx as unknown as Tx, who));
  return { ok: true };
}

export async function fetchClientThreadAction(token: string): Promise<Message[] | null> {
  const who = await resolvePortalToken(token);
  if (!who) return null;
  return adminDb.transaction((tx) => getClientThread(tx as unknown as Tx, who));
}
