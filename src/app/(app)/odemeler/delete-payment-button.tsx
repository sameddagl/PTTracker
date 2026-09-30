"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deletePaymentAction } from "./actions";

export function DeletePaymentButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();

  return (
    <>
      {dialog}
      <Button
      type="button"
      variant="ghost"
      size="icon"
      loading={pending}
      aria-label={`${label} ödemesini sil`}
      onClick={async () => {
        const ok = await confirm({ title: `${label} ödemesi silinsin mi?`, body: "Bunu geri alamazsın.", confirmLabel: "Ödemeyi sil", destructive: true });
        if (!ok) return;
        startTransition(async () => {
          const res = await deletePaymentAction(id);
          if (res.ok) toast.success("Ödeme silindi");
          else toast.error("Ödeme silinemedi");
        });
      }}
    >
      <Trash2 className="text-muted-foreground" />
    </Button>
    </>
  );
}
