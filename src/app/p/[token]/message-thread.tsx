"use client";

import { ChatThread } from "@/app/(app)/mesajlar/[clientId]/chat-thread";
import type { Message } from "@/db/messages";
import { fetchClientThreadAction, markReadByClientAction, sendClientMessageAction } from "./message-actions";

/** The client's chat with their trainer, on the portal page (anchor #mesajlar). */
export function MessageThread({
  token,
  initial,
  trainerName,
  timeZone = "Europe/Istanbul",
}: {
  token: string;
  initial: Message[];
  trainerName: string;
  timeZone?: string;
}) {
  const first = trainerName.split(" ")[0] || "Eğitmenin";
  return (
    <section id="mesajlar" aria-labelledby="messages-heading" className="scroll-mt-6">
      <h2 id="messages-heading" className="mb-3 text-base font-semibold">
        Mesajlar
      </h2>
      <ChatThread
        initial={initial}
        me="client"
        timeZone={timeZone}
        send={(body) => sendClientMessageAction(token, body)}
        poll={() => fetchClientThreadAction(token)}
        markRead={() => markReadByClientAction(token)}
        emptyText={`${first} ile buradan yazışabilirsin. Ders saati, paket ya da aklına takılan her şeyi sorabilirsin.`}
        placeholder={`${first} için mesaj yaz`}
        className="h-[28rem] max-h-[70dvh]"
      />
    </section>
  );
}
