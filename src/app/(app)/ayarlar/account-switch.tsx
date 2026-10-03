"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { switchAccountAction } from "./switch-account-action";

/** For someone who works in more than one account (their own and a studio's, or two studios). */
export function AccountSwitch({ accounts, current }: { accounts: { accountId: string; name: string; role: "owner" | "instructor" }[]; current: string }) {
  const [pending, start] = useTransition();
  return (
    <section aria-labelledby="accounts-heading" className="flex flex-col gap-2">
      <h2 id="accounts-heading" className="text-sm font-semibold">
        Hesaplarım
      </h2>
      <ul className="divide-y overflow-hidden surface">
        {accounts.map((a) => (
          <li key={a.accountId} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{a.name}</span>
              <span className="block text-xs text-muted-foreground">{a.role === "owner" ? "Sahibi" : "Eğitmen"}</span>
            </span>
            {a.accountId === current ? (
              <span className="flex items-center gap-1 text-sm font-medium">
                <Check className="size-4" aria-hidden />
                Şu an
              </span>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await switchAccountAction(a.accountId);
                    if (!res.ok) toast.error("Hesap değiştirilemedi.");
                  })
                }
              >
                Geç
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
