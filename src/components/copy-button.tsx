"use client";

import type { ComponentProps } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";

/** Copies `text` to the clipboard with a toast. */
export function CopyButton({ text, label = "Linki kopyala", ...props }: { text: string; label?: string } & ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      {...props}
      onClick={async () => {
        if (await copyText(text)) toast.success("Link kopyalandı");
        else toast.error("Kopyalanamadı", { description: text, duration: 15000 });
      }}
    >
      <Copy />
      {label}
    </Button>
  );
}
