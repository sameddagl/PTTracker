"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatShortDate, formatTRY } from "@/lib/format";
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
    packageName: string | null;
    due: string | null;
    receiptType: string | null;
  };
}) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/danisanlar/${p.clientId}`} className="block truncate font-medium hover:underline">
            {p.clientName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {formatShortDate(p.paidOn)} · Havale/EFT{p.packageName && ` · ${p.packageName}`}
            {p.due !== null && ` · kalan ${formatTRY(p.due)}`}
          </p>
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
          <span className="text-xs text-muted-foreground">Dekont eklenmemiş</span>
        )}
        <span className="flex-1" />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          className="text-destructive hover:text-destructive"
          onClick={() => {
            const reason = window.prompt("Neden onaylamıyorsun? (danışan görecek, boş bırakabilirsin)");
            if (reason === null) return;
            startTransition(async () => {
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
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
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
