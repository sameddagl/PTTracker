"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deletePaymentAction } from "./actions";

export function DeletePaymentButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={`${label} ödemesini sil`}
      onClick={() => {
        if (!window.confirm(`${label} ödemesi silinsin mi? Bu işlem geri alınamaz.`)) return;
        startTransition(async () => {
          const res = await deletePaymentAction(id);
          if (res.ok) toast.success("Ödeme silindi");
          else toast.error("Ödeme silinemedi");
        });
      }}
    >
      <Trash2 className="text-muted-foreground" />
    </Button>
  );
}
