"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Copy, Hourglass, Landmark, Paperclip, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Field, FormError } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatShortDate, formatTRY } from "@/lib/format";
import type { InstallmentState } from "@/lib/installments";
import { cn } from "@/lib/utils";
import { reportPaymentAction, type ReportState } from "./actions";

export type PackagePlan = { id: string; name: string; code: string; states: InstallmentState[] };
type Rejected = { id: string; amount: string; paidOn: string; rejectReason: string | null };

const STATUS: Record<InstallmentState["status"], { label: string; className: string }> = {
  paid: { label: "Ödendi", className: "text-success-strong" },
  pending: { label: "Onay bekliyor", className: "text-warning-strong" },
  due: { label: "Bugün", className: "text-foreground font-medium" },
  overdue: { label: "Gecikti", className: "text-destructive-strong font-medium" },
  upcoming: { label: "Ödenecek", className: "text-muted-foreground" },
};

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
        {/* Wrap between groups rather than truncate: the client must see the whole IBAN. */}
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
            toast.error("Kopyalanamadı. Üstüne basılı tutup kopyala.");
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
  plans,
  iban,
  ibanDisplay,
  holder,
  rejected,
}: {
  token: string;
  plans: PackagePlan[];
  iban: string;
  ibanDisplay: string;
  holder: string;
  rejected: Rejected[];
}) {
  const [state, action, pending] = useActionState<ReportState, FormData>(reportPaymentAction.bind(null, token), {});
  // The form for one package stays open from when it was opened until the next successful report.
  const [opened, setOpened] = useState<{ id: string; at: number } | null>(null);
  const openFor = opened && !(state.savedAt && state.savedAt > opened.at) ? opened.id : null;
  const [preparing, setPreparing] = useState(false);
  const e = state.errors ?? {};

  useEffect(() => {
    if (state.savedAt) toast.success("Eğitmenine haber verdik");
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
        toast.error("Bu dosya açılamadı. Başka bir fotoğraf dene.");
        return;
      } finally {
        setPreparing(false);
      }
    }
    startTransition(() => action(fd));
  }

  return (
    <section aria-labelledby="payment-heading" className="flex flex-col gap-3">
      <h2 id="payment-heading" className="text-base font-semibold">
        Ödeme
      </h2>

      {plans.map((p) => {
        const next = p.states.find((s) => s.remaining > 0.001);
        const multi = p.states.length > 1;
        const total = p.states.reduce((sum, s) => sum + s.amount, 0);
        const paidCount = p.states.filter((s) => s.status === "paid").length;
        return (
          <div key={p.id} className="flex flex-col gap-4 surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {multi ? `${paidCount}/${p.states.length} taksit ödendi` : "Tek ödeme"}
                </p>
              </div>
              <p className="shrink-0 text-base font-semibold tabular-nums">{formatTRY(total)}</p>
            </div>

            <ol className="flex flex-col divide-y overflow-hidden rounded-xl border text-sm">
              {p.states.map((s) => (
                <li key={s.seq} className={cn("flex items-center gap-3 px-3 py-3", next?.seq === s.seq && "bg-muted/60")}>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{multi ? `${s.seq}. taksit` : "Paket ücreti"}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatShortDate(s.dueOn)}
                      {s.status !== "paid" && s.status !== "pending" && s.remaining < s.amount - 0.001 && (
                        <> · {formatTRY(s.amount - s.remaining)} ödendi</>
                      )}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatTRY(s.amount)}</span>
                  <span className={cn("inline-flex w-24 items-center justify-end gap-1 text-xs", STATUS[s.status].className)}>
                    {s.status === "paid" && <CheckCircle2 className="size-3.5" aria-hidden />}
                    {s.status === "pending" && <Hourglass className="size-3.5" aria-hidden />}
                    {STATUS[s.status].label}
                  </span>
                </li>
              ))}
            </ol>

            {next && (
              <>
                <div className="flex flex-col gap-3 rounded-xl bg-muted/60 p-3 sm:p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <span className="flex size-7 items-center justify-center rounded-full bg-card" aria-hidden>
                      <Landmark className="size-3.5" />
                    </span>
                    Havale / EFT bilgileri
                  </p>
                  <CopyRow label="IBAN" value={iban} display={ibanDisplay} />
                  <CopyRow label="Alıcı" value={holder} />
                  <CopyRow label="Açıklamaya yaz" value={p.code} />
                  <CopyRow label="Tutar" value={String(next.remaining).replace(".", ",")} display={formatTRY(next.remaining)} />
                </div>

                {openFor === p.id ? (
                  <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
                    <input type="hidden" name="clientPackageId" value={p.id} />
                    <FormError message={e.form} />
                    <p className="text-sm">
                      <span className="text-muted-foreground">{multi ? `${next.seq}. taksit` : "Ödeme"}: </span>
                      <span className="font-semibold tabular-nums">{formatTRY(next.remaining)}</span>
                    </p>
                    <Field id="receipt" label="Dekont" hint="isteğe bağlı · fotoğraf ya da PDF" error={e.receipt}>
                      <Input
                        id="receipt"
                        name="receipt"
                        type="file"
                        accept="image/*,application/pdf"
                        className="py-2.5 file:mr-3 file:h-7 file:rounded-full file:bg-muted file:px-3"
                      />
                    </Field>
                    <Field id="note" label="Not" hint="isteğe bağlı">
                      <Input id="note" name="note" maxLength={300} />
                    </Field>
                    <div className="flex gap-2">
                      <Button type="submit" loading={pending || preparing} className="flex-1 sm:flex-none">
                        <Paperclip />
                        {preparing ? "Hazırlanıyor…" : pending ? "Gönderiliyor…" : "Bildir"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setOpened(null)}>
                        Vazgeç
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button type="button" size="lg" className="h-auto min-h-12 py-3 whitespace-normal" onClick={() => setOpened({ id: p.id, at: Date.now() })}>
                    {multi ? `${next.seq}. taksidi ödedim` : "Ödemeyi yaptım"} · {formatTRY(next.remaining)}
                  </Button>
                )}
              </>
            )}
          </div>
        );
      })}

      {rejected.map((r) => (
        <p key={r.id} className="flex items-start gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm">
          <XCircle className="mt-0.5 size-4 shrink-0 text-destructive-strong" aria-hidden />
          <span>
            {formatShortDate(r.paidOn)} tarihli {formatTRY(r.amount)} ödemen onaylanmadı
            {r.rejectReason ? `: ${r.rejectReason}` : "."}
          </span>
        </p>
      ))}
    </section>
  );
}
