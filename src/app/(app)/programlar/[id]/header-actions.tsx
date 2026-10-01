"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CopyPlus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { archiveProgramAction, saveAsTemplateAction } from "../actions";

export function ProgramHeaderActions({ id, isTemplate }: { id: string; isTemplate: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  return (
    <div className="flex gap-1">
      {dialog}
      <Button asChild size="icon" variant="outline" aria-label="Yazdır ya da PDF olarak kaydet" title="Yazdır / PDF">
        <a href={`/yazdir/${id}`} target="_blank">
          <Printer />
        </a>
      </Button>
      {!isTemplate && (
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Şablon olarak kaydet"
          title="Şablon olarak kaydet"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await saveAsTemplateAction(id);
              if (res.ok) toast.success("Şablon olarak kaydedildi", { description: "Programlar sayfasında görünür." });
              else toast.error(res.error);
            })
          }
        >
          <CopyPlus />
        </Button>
      )}
      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label="Sil"
        disabled={pending}
        onClick={async () => {
          const ok = await confirm({
            title: isTemplate ? "Şablon silinsin mi?" : "Program silinsin mi?",
            body: isTemplate ? "Danışanlara verdiğin kopyalar kalır." : "Danışanın sayfasından da kalkar.",
            confirmLabel: "Sil",
            destructive: true,
          });
          if (!ok) return;
          start(async () => {
            const res = await archiveProgramAction(id);
            if (!res.ok) return void toast.error(res.error);
            router.back();
          });
        }}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
