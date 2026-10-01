"use client";

import { useState, type ComponentProps } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";

/**
 * Copies `text`. The button itself says "Kopyalandı" for a moment; outside a
 * modal dialog a toast confirms it too (inside one, toasts sit behind the dialog).
 */
export function CopyButton({ text, label = "Linki kopyala", ...props }: { text: string; label?: string } & ComponentProps<typeof Button>) {
  const [done, setDone] = useState<"ok" | "fail" | null>(null);
  return (
    <Button
      type="button"
      {...props}
      onClick={async (e) => {
        const inDialog = Boolean(e.currentTarget.closest("dialog[open]"));
        const ok = await copyText(text);
        setDone(ok ? "ok" : "fail");
        setTimeout(() => setDone(null), 2500);
        if (inDialog) return;
        if (ok) toast.success("Link kopyalandı");
        else toast.error("Kopyalanamadı", { description: text, duration: 15000 });
      }}
    >
      {done === "ok" ? <Check /> : <Copy />}
      <span aria-live="polite">{done === "ok" ? "Kopyalandı" : done === "fail" ? "Kopyalanamadı" : label}</span>
    </Button>
  );
}
