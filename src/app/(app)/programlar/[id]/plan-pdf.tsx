"use client";

import { useRef, useTransition } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deletePlanPdfAction, uploadPlanPdfAction } from "../actions";

/** A PDF next to the plan, for a dietitian's list the client already has. */
export function PlanPdf({ programId, fileName }: { programId: string; fileName: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  function upload(file: File) {
    const form = new FormData();
    form.set("pdf", file);
    start(async () => {
      const res = await uploadPlanPdfAction(programId, form);
      if (res.ok) toast.success("PDF eklendi");
      else toast.error(res.error);
      if (input.current) input.current.value = "";
    });
  }

  return (
    <section aria-labelledby="pdf-heading" className="mb-6 flex flex-col gap-3 surface p-4 sm:p-5">
      <div>
        <h2 id="pdf-heading" className="text-base font-semibold">
          PDF ekle
        </h2>
        <p className="text-sm text-muted-foreground">Diyetisyenin hazırladığı listeyi buraya koyabilirsin; danışan planının altında açar. En fazla 1,5 MB.</p>
      </div>
      <input ref={input} type="file" accept="application/pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {fileName ? (
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/programlar/${programId}/pdf`} target="_blank" className="inline-flex min-h-11 flex-1 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
            <FileText className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{fileName}</span>
          </a>
          <Button type="button" variant="outline" size="sm" loading={pending} onClick={() => input.current?.click()}>
            Değiştir
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="PDF'i kaldır"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await deletePlanPdfAction(programId);
                if (!res.ok) toast.error(res.error);
              })
            }
          >
            <Trash2 />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" className="self-start" loading={pending} onClick={() => input.current?.click()}>
          <Upload />
          PDF seç
        </Button>
      )}
    </section>
  );
}
