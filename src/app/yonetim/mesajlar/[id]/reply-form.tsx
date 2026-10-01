"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { closeSupportAction, replySupportAction } from "../actions";

export function ReplyForm({ threadId, viaEmail, closed }: { threadId: string; viaEmail: boolean; closed: boolean }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3 surface p-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={4000} placeholder="Cevabını yaz" aria-label="Cevap" />
      <p className="text-xs text-muted-foreground">{viaEmail ? "Cevap e-postayla gider." : "Eğitmen cevabı uygulamada görür ve bildirim alır."}</p>
      <div className="flex flex-wrap justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await closeSupportAction(threadId, !closed);
              if (!res.ok) toast.error(res.error);
            })
          }
        >
          {closed ? "Yeniden aç" : "Kapat"}
        </Button>
        <Button
          type="button"
          loading={pending}
          disabled={!text.trim()}
          onClick={() =>
            start(async () => {
              const res = await replySupportAction(threadId, text);
              if (!res.ok) return void toast.error(res.error);
              setText("");
              toast.success(viaEmail ? (res.emailed ? "Cevap e-postayla gönderildi" : "Kaydedildi ama e-posta gönderilemedi (SMTP)") : "Cevap gönderildi");
            })
          }
        >
          Gönder
        </Button>
      </div>
    </div>
  );
}
