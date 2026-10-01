"use client";

import { useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendProgramAction } from "../../programlar/actions";

export function SendProgramButton({ id, again, firstName }: { id: string; again: boolean; firstName: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await sendProgramAction(id);
          if (res.ok) toast.success(`${firstName} programı sayfasında görecek`, { description: "Bildirimi açıksa haber de gider." });
          else toast.error(res.error);
        })
      }
    >
      <Send />
      {again ? "Güncellemeyi bildir" : "Danışana gönder"}
    </Button>
  );
}
