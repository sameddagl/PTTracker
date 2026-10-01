"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ShieldCheck, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { ProgressView } from "@/components/progress-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Series } from "@/lib/measurements";
import { grantHealthConsentAction, logWeightAction } from "./progress-actions";

export function ProgressTab({
  token,
  consented,
  selfWeigh,
  series,
  notes,
  today,
  trainerName,
}: {
  token: string;
  consented: boolean;
  selfWeigh: boolean;
  series: Series[];
  notes: { id: string; body: string; when: string }[];
  today: string;
  trainerName: string;
}) {
  const [pending, start] = useTransition();
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const weights = series.find((x) => x.metric.key === "weight")?.points;
  const lastWeight = weights?.length ? String(weights[weights.length - 1].value).replace(".", ",") : null;

  return (
    <div className="flex flex-col gap-6">
      {!consented ? (
        <section aria-labelledby="consent-heading" className="flex flex-col gap-4 surface p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground" aria-hidden>
              <ShieldCheck className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 id="consent-heading" className="text-base font-semibold">
                Gelişimini burada takip et
              </h2>
              <p className="text-sm text-muted-foreground">
                {trainerName} ölçümlerini (kilo, vücut ölçüleri gibi) buraya kaydeder, sen de grafiklerde nasıl değiştiğini görürsün. Bu bilgiler
                sağlık verisi sayıldığı için önce onayın gerekiyor. Onayını istediğin zaman eğitmeninden geri almasını isteyebilirsin.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <Link href="/acik-riza" target="_blank" className="underline underline-offset-4">
              Açık rıza metnini oku
            </Link>
          </p>
          <Button
            type="button"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await grantHealthConsentAction(token);
                if (res.ok) toast.success("Teşekkürler, ölçümlerin artık burada görünecek");
                else toast.error(res.error);
              })
            }
          >
            Ölçümlerimin kaydedilmesine onay veriyorum
          </Button>
        </section>
      ) : (
        <>
          {selfWeigh && (
            <form
              aria-labelledby="weigh-heading"
              className="flex flex-col gap-3 surface p-4"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                start(async () => {
                  const res = await logWeightAction(token, weight, date);
                  if (!res.ok) return setError(res.error);
                  setWeight("");
                  toast.success("Kilon kaydedildi");
                });
              }}
            >
              <h2 id="weigh-heading" className="text-base font-semibold">
                Kilonu gir
              </h2>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Kilo
                  <span className="relative">
                    <Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={lastWeight ?? "68,5"} className="w-32 pr-10" aria-invalid={!!error} />
                    <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
                  </span>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Tarih
                  <Input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="w-44" />
                </label>
                <Button type="submit" loading={pending} disabled={!weight.trim()}>
                  Kaydet
                </Button>
              </div>
              {error && <p className="text-sm text-destructive-strong">{error}</p>}
            </form>
          )}
          <ProgressView
            series={series}
            emptyText={selfWeigh ? "Henüz ölçüm yok. Kilonu girersen ya da eğitmenin ölçüm eklerse grafiğin burada çıkar." : "Henüz ölçüm yok. Eğitmenin ölçüm ekleyince grafiğin burada çıkar."}
          />
        </>
      )}

      {notes.length > 0 && (
        <section aria-labelledby="trainer-notes-heading">
          <h2 id="trainer-notes-heading" className="mb-3 text-base font-semibold">
            Eğitmeninin notları
          </h2>
          <ul className="divide-y overflow-hidden surface">
            {notes.map((n) => (
              <li key={n.id} className="flex gap-3 px-4 py-3">
                <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{n.when}</p>
                  <p className="text-sm whitespace-pre-wrap">{n.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
