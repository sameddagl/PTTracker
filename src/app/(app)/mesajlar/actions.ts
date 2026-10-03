"use server";

import { and, eq } from "drizzle-orm";
import { after } from "next/server";
import { refresh } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { mayOpenClient } from "@/db/team";
import { type Message, getThread, markThreadRead, sendTrainerMessage } from "@/db/messages";
import { getActivePortalLink } from "@/db/portal";
import { clients, trainers } from "@/db/schema";
import { notifyClient } from "@/lib/notify";

type Result = { ok: true; message: Message } | { ok: false; error: string };

const ERRORS = {
  empty: "Mesaj boş olamaz.",
  too_long: "Mesaj en fazla 2000 karakter olabilir.",
  not_found: "Danışan bulunamadı.",
  rate_limited: "Çok hızlı mesaj gönderiyorsun. Biraz bekleyip tekrar dene.",
} as const;

const preview = (body: string) => (body.length > 140 ? `${body.slice(0, 139)}…` : body);

export async function sendMessageAction(clientId: string, body: string): Promise<Result> {
  if (!z.uuid().safeParse(clientId).success || typeof body !== "string") return { ok: false, error: "Bir sorun oldu. Sayfayı yenileyip tekrar dene." };

  const out = await withTrainer(async (tx, trainerId, member) => {
    if (!(await mayOpenClient(tx, member, clientId))) return { result: { ok: false, reason: "not_found" } } as const;
    const result = await sendTrainerMessage(tx, trainerId, clientId, body, member.id);
    if (!result.ok) return { result } as const;
    const [info] = await tx
      .select({ trainerName: trainers.fullName, businessName: trainers.businessName, clientEmail: clients.email })
      .from(clients)
      .innerJoin(trainers, eq(trainers.id, clients.trainerId))
      .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId)));
    const link = await getActivePortalLink(tx, clientId);
    return { result, trainerId, info, token: link?.token ?? null, memberName: member.role === "instructor" ? member.name : null } as const;
  });
  if (!out.result.ok) return { ok: false, error: ERRORS[out.result.reason] };

  const { result, trainerId, info, token, memberName } = out;
  // The client reads messages on their portal; without a link there is nowhere to send them.
  // Messages never go by e-mail, only as a push when the client wants them.
  if (token && info) {
    const name = memberName || info.trainerName || info.businessName || "Eğitmenin";
    const body = preview(result.message.body);
    after(() => notifyClient({ trainerId, clientId }, "message", { title: name, body, hash: "#mesajlar", tag: `message-${clientId}` }));
  }
  return { ok: true, message: result.message };
}

/** Marks the client's messages read; refreshes the nav badge when anything changed. */
export async function markThreadReadAction(clientId: string): Promise<{ ok: boolean }> {
  if (!z.uuid().safeParse(clientId).success) return { ok: false };
  const changed = await withTrainer(async (tx, trainerId, member) => ((await mayOpenClient(tx, member, clientId)) ? markThreadRead(tx, trainerId, clientId) : 0));
  if (changed > 0) refresh();
  return { ok: true };
}

export async function fetchThreadAction(clientId: string): Promise<Message[] | null> {
  if (!z.uuid().safeParse(clientId).success) return null;
  return withTrainer(async (tx, trainerId, member) => ((await mayOpenClient(tx, member, clientId)) ? getThread(tx, trainerId, clientId) : null));
}
