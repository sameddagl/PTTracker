"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { formatShortDate, formatTRY } from "@/lib/format";
import { paymentCode } from "@/lib/iban";
import { confirmPaymentAction, rejectPaymentAction } from "./actions";

export function PendingPaymentCard({
  payment: p,
}: {
  payment: {
    id: string;
    amount: string;
    paidOn: string;
    note: string | null;
    clientId: string;
    clientName: string;
    clientPackageId?: string | null;
    packageName: string | null;
    due: string | null;
    receiptType: string | null;
  };
}) {
  const [rejecting, startReject] = useTransition();
  const [confirming, startConfirm] = useTransition();
  const { ask, dialog } = useConfirm();

  return (
    <li className="flex flex-col gap-3 surface p-4">
      {dialog}
      <div className="flex items-start justify-between gap-3">
        <Avatar name={p.clientName} />
        <div className="min-w-0 flex-1">
          <Link href={`/danisanlar/${p.clientId}`} className="block truncate font-medium hover:underline">
            {p.clientName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {formatShortDate(p.paidOn)} · Havale/EFT{p.packageName && ` · ${p.packageName}`}
            {p.due !== null && ` · kalan ${formatTRY(p.due)}`}
          </p>
          {p.clientPackageId && (
            <p className="text-xs text-muted-foreground">
              Açıklama kodu <span className="font-mono font-medium text-foreground">{paymentCode(p.clientName, p.clientPackageId)}</span>
            </p>
          )}
          {p.note && <p className="mt-1 text-sm">{p.note}</p>}
        </div>
        <p className="shrink-0 text-xl font-semibold tabular-nums">{formatTRY(p.amount)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {p.receiptType ? (
          <Button asChild size="sm" variant="outline">
            <a href={`/odemeler/dekont/${p.id}`} target="_blank" rel="noopener noreferrer">
              <FileText />
              Dekontu aç
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Dekont yok</span>
        )}
        <span className="flex-1" />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={confirming}
          loading={rejecting}
          className="text-destructive-strong hover:text-destructive-strong"
          onClick={async () => {
            const reason = await ask({
              title: "Ödeme bildirimi reddedilsin mi?",
              input: { label: "Neden onaylamıyorsun?", placeholder: "Danışan bu notu görür; boş da bırakabilirsin.", maxLength: 200 },
              confirmLabel: "Reddet",
              destructive: true,
            });
            if (reason === null) return;
            startReject(async () => {
              const res = await rejectPaymentAction(p.id, reason);
              if (res.ok) toast("Bildirim reddedildi");
              else toast.error("Reddedilemedi");
            });
          }}
        >
          <X />
          Reddet
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={rejecting}
          loading={confirming}
          onClick={() =>
            startConfirm(async () => {
              const res = await confirmPaymentAction(p.id);
              if (res.ok) toast.success(`${formatTRY(p.amount)} ödeme onaylandı`);
              else toast.error(res.error);
            })
          }
        >
          <Check />
          Hesabıma geçti, onayla
        </Button>
      </div>
    </li>
  );
}
