"use client";

import type { ComponentProps } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Copies `text` to the clipboard with a toast. */
export function CopyButton({ text, label = "Linki kopyala", ...props }: { text: string; label?: string } & ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      {...props}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast.success("Link kopyalandı");
        } catch {
          toast.error("Kopyalanamadı. Linki basılı tutup kopyala.");
        }
      }}
    >
      <Copy />
      {label}
    </Button>
  );
}
