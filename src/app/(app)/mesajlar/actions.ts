"use server";

import { and, eq } from "drizzle-orm";
import { after } from "next/server";
import { refresh } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { type Message, getThread, markThreadRead, sendTrainerMessage } from "@/db/messages";
import { getActivePortalLink } from "@/db/portal";
import { clients, trainers } from "@/db/schema";
import { layout, sendMail } from "@/lib/mail";
import { portalUrl } from "@/lib/portal";
import { sendPush } from "@/lib/push";

type Result = { ok: true; message: Message } | { ok: false; error: string };

const ERRORS = {
  empty: "Boş mesaj gönderilemez.",
  too_long: "Mesaj en fazla 2000 karakter olabilir.",
  not_found: "Danışan bulunamadı.",
  rate_limited: "Çok hızlı mesaj gönderiyorsun. Biraz bekleyip tekrar dene.",
} as const;

const preview = (body: string) => (body.length > 140 ? `${body.slice(0, 139)}…` : body);

export async function sendMessageAction(clientId: string, body: string): Promise<Result> {
  if (!z.uuid().safeParse(clientId).success || typeof body !== "string") return { ok: false, error: "Geçersiz istek." };

  const out = await withTrainer(async (tx, trainerId) => {
    const result = await sendTrainerMessage(tx, trainerId, clientId, body);
    if (!result.ok) return { result } as const;
    const [info] = await tx
      .select({ trainerName: trainers.fullName, businessName: trainers.businessName, clientEmail: clients.email })
      .from(clients)
      .innerJoin(trainers, eq(trainers.id, clients.trainerId))
      .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId)));
    const link = await getActivePortalLink(tx, clientId);
    return { result, trainerId, info, token: link?.token ?? null } as const;
  });
  if (!out.result.ok) return { ok: false, error: ERRORS[out.result.reason] };

  const { result, trainerId, info, token } = out;
  // The client reads messages on their portal; without a link there is nowhere to send them.
  if (token && info) {
    const { message, firstUnread } = result;
    const name = info.trainerName || info.businessName || "Eğitmenin";
    const url = `${portalUrl(token)}#mesajlar`;
    after(async () => {
      const pushed = await sendPush({ trainerId, clientId }, { title: name, body: preview(message.body), url, tag: `message-${clientId}` });
      // Email only when no device got it, and once per burst of unread messages.
      if (pushed === 0 && firstUnread && info.clientEmail) {
        const { html, text } = layout({
          heading: `${name} sana mesaj gönderdi`,
          lines: [preview(message.body)],
          cta: { label: "Mesajı aç", url },
        });
        await sendMail({ to: info.clientEmail, subject: `${name} sana mesaj gönderdi`, html, text });
      }
    });
  }
  return { ok: true, message: result.message };
}

/** Marks the client's messages read; refreshes the nav badge when anything changed. */
export async function markThreadReadAction(clientId: string): Promise<{ ok: boolean }> {
  if (!z.uuid().safeParse(clientId).success) return { ok: false };
  const changed = await withTrainer((tx, trainerId) => markThreadRead(tx, trainerId, clientId));
  if (changed > 0) refresh();
  return { ok: true };
}

export async function fetchThreadAction(clientId: string): Promise<Message[] | null> {
  if (!z.uuid().safeParse(clientId).success) return null;
  return withTrainer((tx, trainerId) => getThread(tx, trainerId, clientId));
}
