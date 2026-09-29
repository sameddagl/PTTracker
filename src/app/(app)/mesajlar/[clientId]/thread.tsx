"use client";

import type { Message } from "@/db/messages";
import { fetchThreadAction, markThreadReadAction, sendMessageAction } from "../actions";
import { ChatThread } from "./chat-thread";

/** The trainer's side of one conversation. */
export function TrainerThread({
  clientId,
  firstName,
  initial,
  timeZone,
  archived,
}: {
  clientId: string;
  firstName: string;
  initial: Message[];
  timeZone: string;
  archived: boolean;
}) {
  return (
    <ChatThread
      initial={initial}
      me="trainer"
      timeZone={timeZone}
      send={(body) => sendMessageAction(clientId, body)}
      poll={() => fetchThreadAction(clientId)}
      markRead={() => markThreadReadAction(clientId)}
      emptyText={`${firstName} ile henüz mesajlaşmadınız. İlk mesajı sen yaz.`}
      placeholder={`${firstName} için mesaj yaz`}
      closed={archived ? "Danışan arşivde. Mesaj göndermek için önce arşivden çıkar." : undefined}
      className="h-[calc(100dvh-17rem)] min-h-80 md:h-[calc(100dvh-14rem)]"
    />
  );
}
