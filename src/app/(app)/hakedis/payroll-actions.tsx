"use client";

import { useTransition } from "react";
import { Check, Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { closeMonthAction, reopenMonthAction, setPaidAction } from "./actions";

export function PayrollButtons({
  memberId,
  month,
  name,
  amount,
  closed,
}: {
  memberId: string;
  month: string;
  name: string;
  amount: string;
  closed: { id: string; paid: boolean } | null;
}) {
  const [pending, start] = useTransition();
  const { confirm, dialog } = useConfirm();
  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, done?: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error);
      else if (done) toast.success(done);
    });

  if (!closed) {
    return (
      <>
        {dialog}
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={pending}
          onClick={async () => {
            const ok = await confirm({
              title: `${name} için ay kapatılsın mı?`,
              body: `Tutar ${amount} olarak sabitlenir; bu aydaki derslerde sonradan yapılan değişiklikler hakedişi değiştirmez.`,
              confirmLabel: "Ayı kapat",
            });
            if (ok) run(() => closeMonthAction(memberId, month), "Ay kapatıldı");
          }}
        >
          <Lock />
          Ayı kapat
        </Button>
      </>
    );
  }
  return (
    <div className="flex gap-1">
      <Button
        type="button"
        size="sm"
        variant={closed.paid ? "secondary" : "default"}
        loading={pending}
        onClick={() => run(() => setPaidAction(closed.id, !closed.paid), closed.paid ? undefined : "Ödendi olarak işaretlendi")}
      >
        <Check />
        {closed.paid ? "Ödendi" : "Ödendi işaretle"}
      </Button>
      {!closed.paid && (
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Ayı yeniden aç" disabled={pending} onClick={() => run(() => reopenMonthAction(closed.id))}>
          <LockOpen />
        </Button>
      )}
    </div>
  );
}
