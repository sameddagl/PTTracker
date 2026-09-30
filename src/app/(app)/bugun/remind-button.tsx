"use client";

import { useTransition } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { remindUnconfirmedAction } from "./actions";

/** Sends the reminder again to everyone booked tomorrow who hasn't answered. */
export function RemindButton({ count }: { count: number }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await remindUnconfirmedAction();
          if (!res.ok) return void toast(res.error);
          if (res.unreachable === 0) toast.success(`${res.sent} kişiye hatırlatma gitti`);
          else
            toast(res.sent > 0 ? `${res.sent} kişiye hatırlatma gitti` : "Hatırlatma kimseye ulaşmadı", {
              description: `${res.unreachable} kişinin bildirimi kapalı. Onlara mesaj ya da WhatsApp'tan yazabilirsin.`,
              duration: 8000,
            });
        })
      }
    >
      <BellRing />
      Hatırlat ({count})
    </Button>
  );
}
