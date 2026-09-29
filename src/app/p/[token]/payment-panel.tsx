"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { Copy, Hourglass, Landmark, Paperclip, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Field, FormError } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatShortDate, formatTRY } from "@/lib/format";
import { reportPaymentAction, type ReportState } from "./actions";

type Due = { id: string; name: string; due: number; code: string; pendingTotal: number };
type Reported = { id: string; clientPackageId: string | null; amount: string; paidOn: string; status: "pending" | "confirmed" | "rejected"; rejectReason: string | null };

/** Photos are shrunk in the browser (phone photos are often 5+ MB); PDFs go as they are. */
async function prepareReceipt(file: File): Promise<Blob> {
  if (file.type === "application/pdf") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.8));
  if (!blob) throw new Error("encode failed");
  return blob;
}

function CopyRow({ label, value, display }: { label: string; value: string; display?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {/* Wrap rather than truncate: the client must see the whole IBAN. */}
        <p className="font-mono text-xs break-words select-all sm:text-sm">{display ?? value}</p>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={`${label} kopyala`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} kopyalandı`);
          } catch {
            toast.error("Kopyalanamadı; basılı tutup kopyala.");
          }
        }}
      >
        <Copy />
      </Button>
    </div>
  );
}

export function PaymentPanel({
  token,
  dues,
  iban,
  ibanDisplay,
  holder,
  reported,
  today,
}: {
  token: string;
  dues: Due[];
  iban: string;
  ibanDisplay: string;
  holder: string;
  reported: Reported[];
  today: string;
}) {
  const [state, action, pending] = useActionState<ReportState, FormData>(reportPaymentAction.bind(null, token), {});
  // The form for one package stays open from when it was opened until the next successful report.
  const [opened, setOpened] = useState<{ id: string; at: number } | null>(null);
  const openFor = opened && !(state.savedAt && state.savedAt > opened.at) ? opened.id : null;
  const [preparing, setPreparing] = useState(false);
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.savedAt) toast.success("Bildirimin eğitmenine iletildi");
  }, [state.savedAt]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const file = fd.get("receipt");
    if (file instanceof File && file.size > 0) {
      try {
        setPreparing(true);
        const blob = await prepareReceipt(file);
        fd.set("receipt", new File([blob], blob.type === "application/pdf" ? file.name : "dekont.webp", { type: blob.type }));
      } catch {
        toast.error("Dosya hazırlanamadı. Başka bir fotoğraf dene.");
        return;
      } finally {
        setPreparing(false);
      }
    }
    startTransition(() => action(fd));
  }

  return (
    <section aria-labelledby="payment-heading" className="flex flex-col gap-3">
      <h2 id="payment-heading" className="text-sm font-medium text-muted-foreground">
        Ödeme
      </h2>

      {dues.map((d) => {
        const remaining = Math.max(d.due - d.pendingTotal, 0);
        return (
          <Card key={d.id}>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{d.name}</p>
                <p className="text-lg font-semibold tabular-nums">{formatTRY(d.due)}</p>
              </div>
              {d.pendingTotal > 0 && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hourglass className="size-4 text-amber-500" aria-hidden />
                  {formatTRY(d.pendingTotal)} için bildirimin onay bekliyor.
                </p>
              )}

              <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Landmark className="size-4 text-primary" aria-hidden />
                  Havale / EFT bilgileri
                </p>
                <CopyRow label="IBAN" value={iban} display={ibanDisplay} />
                <CopyRow label="Alıcı" value={holder} />
                <CopyRow label="Açıklamaya yaz" value={d.code} />
              </div>

              {remaining > 0 &&
                (openFor === d.id ? (
                  <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
                    <input type="hidden" name="clientPackageId" value={d.id} />
                    <FormError message={e.form} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field id="amount" label="Gönderilen tutar (₺)" error={e.amount}>
                        <Input id="amount" name="amount" inputMode="decimal" defaultValue={String(remaining).replace(".", ",")} />
                      </Field>
                      <Field id="paidOn" label="Tarih" error={e.paidOn}>
                        <Input id="paidOn" name="paidOn" type="date" max={today} defaultValue={today} />
                      </Field>
                    </div>
                    <Field id="receipt" label="Dekont" hint="isteğe bağlı · fotoğraf ya da PDF" error={e.receipt}>
                      <Input id="receipt" name="receipt" type="file" accept="image/*,application/pdf" className="py-1.5" />
                    </Field>
                    <Field id="note" label="Not" hint="isteğe bağlı">
                      <Input id="note" name="note" maxLength={300} />
                    </Field>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={pending || preparing}>
                        <Paperclip />
                        {preparing ? "Hazırlanıyor…" : pending ? "Gönderiliyor…" : "Bildir"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setOpened(null)}>
                        Vazgeç
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button type="button" onClick={() => setOpened({ id: d.id, at: Date.now() })}>
                    Ödemeyi yaptım
                  </Button>
                ))}
            </CardContent>
          </Card>
        );
      })}

      {reported
        .filter((r) => r.status === "rejected")
        .map((r) => (
          <p key={r.id} className="flex items-start gap-2 rounded-xl border border-destructive/40 px-4 py-3 text-sm">
            <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            <span>
              {formatShortDate(r.paidOn)} tarihli {formatTRY(r.amount)} bildirimin onaylanmadı
              {r.rejectReason ? `: ${r.rejectReason}` : "."}
            </span>
          </p>
        ))}
    </section>
  );
}
