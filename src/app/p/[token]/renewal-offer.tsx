"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestPackageAction } from "./actions";

/** Shown on a package that is about to run out: one tap asks the trainer for the same package again. */
export function RenewalOffer({
  token,
  templateId,
  installments,
  reason,
}: {
  token: string;
  templateId: string;
  installments: number;
  reason: string;
}) {
  const [pending, start] = useTransition();

  function renew() {
    start(async () => {
      const res = await requestPackageAction(token, templateId, installments);
      if (res.ok) toast.success("Yenileme isteğini eğitmenine ilettik");
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-lime p-3 text-lime-foreground sm:flex-row sm:items-center">
      <p className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <RefreshCw className="size-4 shrink-0" aria-hidden />
        <span>{reason} Aynı paketle devam etmek ister misin?</span>
      </p>
      <Button type="button" size="sm" onClick={renew} loading={pending} className="bg-[#1d1d1f] text-white hover:bg-[#1d1d1f]/85">
        Paketi yenile
      </Button>
    </div>
  );
}
