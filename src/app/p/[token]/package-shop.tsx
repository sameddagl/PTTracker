"use client";

import { useState, useTransition } from "react";
import { Hourglass } from "lucide-react";
import { toast } from "sonner";
import { PriceTag } from "@/components/price-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SESSION_TYPE_LABELS, formatTRY } from "@/lib/format";
import { monthlyAmount, optionLabel, paymentOptions, type PricedTemplate } from "@/lib/pricing";
import { requestPackageAction } from "./actions";

type Offer = PricedTemplate & {
  id: string;
  name: string;
  sessionType: keyof typeof SESSION_TYPE_LABELS;
  sessionCount: number;
  validityDays: number | null;
};

/** The trainer's packages, requested from the portal without filling the sign-up form again. */
export function PackageShop({ token, offers, pendingIds, hasPackage }: { token: string; offers: Offer[]; pendingIds: string[]; hasPackage: boolean }) {
  const [open, setOpen] = useState(!hasPackage);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function request(o: Offer, installments: number) {
    setBusy(`${o.id}:${installments}`);
    start(async () => {
      const res = await requestPackageAction(token, o.id, installments);
      if (res.ok) toast.success(`${o.name} isteğini eğitmenine ilettik`);
      else toast.error(res.error);
    });
  }

  if (offers.length === 0) return null;

  return (
    <section aria-labelledby="shop-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="shop-heading" className="text-base font-semibold">
          {hasPackage ? "Yeni paket al" : "Paket al"}
        </h2>
        {hasPackage && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? "Gizle" : "Paketleri gör"}
          </Button>
        )}
      </div>
      {open && (
        <>
          <p className="-mt-1 text-sm text-muted-foreground">
            Seçtiğin paket, eğitmenin onaylayınca burada görünür. Şu anki paketlerin olduğu gibi devam eder.
          </p>
          <ul className="flex flex-col gap-3">
            {offers.map((o) => {
              const options = paymentOptions(o);
              const waiting = pendingIds.includes(o.id);
              return (
                <li key={o.id} className="flex flex-col gap-4 surface p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{o.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {SESSION_TYPE_LABELS[o.sessionType]} · {o.sessionCount} ders
                        {o.validityDays ? ` · ${o.validityDays} gün geçerli` : ""}
                      </p>
                    </div>
                    {o.price && <PriceTag price={o.price} compareAtPrice={o.compareAtPrice} size="md" className="max-w-36" />}
                  </div>
                  {waiting ? (
                    <Badge variant="warning" className="h-8 self-start px-3">
                      <Hourglass aria-hidden />
                      Onay bekliyor
                    </Badge>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(options.length > 0 ? options : [{ installments: 1, total: 0 }]).map((opt) => (
                        <Button
                          key={opt.installments}
                          type="button"
                          size="sm"
                          variant={opt.installments === 1 ? "default" : "outline"}
                          disabled={pending}
                          loading={pending && busy === `${o.id}:${opt.installments}`}
                          onClick={() => request(o, opt.installments)}
                        >
                          {options.length === 0
                            ? "Başvur"
                            : opt.installments > 1
                              ? `${optionLabel(opt)} · ${opt.installments} × ${formatTRY(monthlyAmount(opt))}`
                              : `Peşin · ${formatTRY(opt.total)}`}
                        </Button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
