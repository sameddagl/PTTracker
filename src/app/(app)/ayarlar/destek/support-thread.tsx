"use client";

import { ChatThread } from "@/app/(app)/mesajlar/[clientId]/chat-thread";
import type { Message } from "@/db/messages";
import { fetchSupportAction, markSupportReadAction, sendSupportAction } from "./actions";

/** The trainer's conversation with the team; our replies show as the other side. */
export function SupportThread({ initial, timeZone }: { initial: Message[]; timeZone: string }) {
  return (
    <div data-chat>
      <ChatThread
        initial={initial}
        me="trainer"
        timeZone={timeZone}
        send={sendSupportAction}
        poll={fetchSupportAction}
        markRead={markSupportReadAction}
        emptyText="Henüz yazışmadık. Ne sormak ya da önermek istersen yaz; en kısa sürede dönüyoruz."
        placeholder="Mesajını yaz"
        className="h-[calc(100dvh-16rem-env(safe-area-inset-bottom))] min-h-80 md:h-[calc(100dvh-16rem)]"
      />
    </div>
  );
}
