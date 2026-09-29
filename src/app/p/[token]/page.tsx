import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ATTENDANCE_LABELS,
  SESSION_TYPE_LABELS,
  formatDayMonth,
  formatLongDate,
  formatShortDate,
  formatTRY,
  formatTime,
} from "@/lib/format";
import { getPortalData } from "@/lib/portal";

// Personal links must never be indexed or leak through referrers.
export const metadata: Metadata = { title: "Derslerim", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function PortalPage({ params }: PageProps<"/p/[token]">) {
  const { token } = await params;
  const data = await getPortalData(token);
  if (!data) notFound();

  const { client, packages, upcoming, recent } = data;
  const tz = client.timezone;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm text-muted-foreground">{client.businessName || client.trainerName}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Merhaba {client.fullName.split(" ")[0]}</h1>
      </header>

      {packages.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Şu an aktif paketin yok.
        </p>
      ) : (
        packages.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{p.name}</p>
                {p.state === "frozen" && <span className="text-xs text-muted-foreground">Donduruldu</span>}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-semibold tabular-nums">{p.remaining}</span>
                <span className="pb-1.5 text-muted-foreground">/ {p.total} ders kaldı</span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={p.total}
                aria-valuenow={p.remaining}
                aria-label="Kalan ders"
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${(p.remaining / p.total) * 100}%` }} />
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {p.expiresOn && (
                  <div>
                    <dt className="text-muted-foreground">Son tarih</dt>
                    <dd className="font-medium">{formatShortDate(p.expiresOn)}</dd>
                  </div>
                )}
                {Number(p.due) > 0 && (
                  <div>
                    <dt className="text-muted-foreground">Kalan ödeme</dt>
                    <dd className="font-medium">{formatTRY(p.due)}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        ))
      )}

      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="mb-3 text-sm font-medium text-muted-foreground">
          Sıradaki derslerin
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Planlanmış ders yok.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((l) => (
              <li key={l.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <CalendarClock className="size-4 text-primary" aria-hidden />
                <span className="flex-1 capitalize">{formatLongDate(l.startsAt, tz)}</span>
                <span className="text-sm tabular-nums">{formatTime(l.startsAt, tz)}</span>
                <span className="text-xs text-muted-foreground">{SESSION_TYPE_LABELS[l.sessionType]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="mb-3 text-sm font-medium text-muted-foreground">
            Son derslerin
          </h2>
          <ul className="divide-y rounded-lg border text-sm">
            {recent.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-14 tabular-nums">{formatDayMonth(l.startsAt, tz)}</span>
                <span className="flex-1 text-muted-foreground tabular-nums">{formatTime(l.startsAt, tz)}</span>
                <span className={l.status === "attended" ? "" : "text-muted-foreground"}>
                  {l.makeupUsed ? "Geç iptal (telafi)" : ATTENDANCE_LABELS[l.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-auto pt-6 text-center text-xs text-muted-foreground">
        Bu sayfa sadece sana özel. Linki başkasıyla paylaşma.
      </footer>
    </main>
  );
}
