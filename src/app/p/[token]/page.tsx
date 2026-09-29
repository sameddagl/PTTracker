import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock, CheckCircle2, Hourglass, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ATTENDANCE_LABELS,
  SESSION_TYPE_LABELS,
  formatDayMonth,
  formatLongDate,
  formatShortDate,
  formatTRY,
  formatTime,
  todayISO,
} from "@/lib/format";
import { formatIban, paymentCode } from "@/lib/iban";
import { getPortalData, portalUrl } from "@/lib/portal";
import { PaymentPanel } from "./payment-panel";
import { whatsappLink } from "@/lib/whatsapp";

// Personal links must never be indexed or leak through referrers.
export const metadata: Metadata = { title: "Derslerim", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function PortalPage({ params, searchParams }: PageProps<"/p/[token]">) {
  const { token } = await params;
  const { yeni } = await searchParams;
  const data = await getPortalData(token);
  if (!data) notFound();

  const { client, packages, upcoming, recent, application, reported } = data;
  const tz = client.timezone;
  const trainerName = client.businessName || client.trainerName;
  const url = portalUrl(token);
  const toTrainer = whatsappLink(
    client.trainerPhone,
    `Merhaba, ${application?.packageName ?? "paket"} için başvurdum. Sayfam: ${url}`,
  );
  const pending = application?.status === "pending";
  const dues = packages
    .filter((p) => Number(p.due) > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      due: Number(p.due),
      code: paymentCode(client.fullName, p.id),
      pendingTotal: reported
        .filter((r) => r.status === "pending" && r.clientPackageId === p.id)
        .reduce((sum, r) => sum + Number(r.amount), 0),
    }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm text-muted-foreground">{trainerName}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Merhaba {client.fullName.split(" ")[0]}</h1>
      </header>

      {yeni && (
        <Card className="border-emerald-600/40 bg-emerald-600/10">
          <CardContent className="flex flex-col gap-3">
            <p className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
              Başvurun alındı
            </p>
            <p className="text-sm text-muted-foreground">
              Bu sayfa senin kişisel sayfan. Paketini, derslerini ve ödeme bilgilerini buradan takip edeceksin. Kaybetmemek için
              linki kendine kaydet ya da eğitmenine gönder.
            </p>
            {toTrainer && (
              <Button asChild>
                <a href={toTrainer} target="_blank" rel="noopener noreferrer">
                  <MessageCircle />
                  Linki WhatsApp&apos;tan {trainerName}&apos;a gönder
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {pending && (
        <Card>
          <CardContent className="flex items-center gap-3">
            <Hourglass className="size-5 shrink-0 text-amber-500" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{application.packageName}</p>
              <p className="text-sm text-muted-foreground">Eğitmenin onayı bekleniyor. Onaylanınca sana haber vereceğiz.</p>
            </div>
            {application.price && <span className="font-semibold tabular-nums">{formatTRY(application.price)}</span>}
          </CardContent>
        </Card>
      )}

      {application?.status === "rejected" && packages.length === 0 && (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Başvurun şu an kabul edilemedi. Detaylar için {trainerName} ile iletişime geçebilirsin.
        </p>
      )}

      {pending || (application?.status === "rejected" && packages.length === 0) ? null : packages.length === 0 ? (
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

      {(dues.length > 0 || reported.some((r) => r.status === "rejected")) &&
        (client.iban && client.ibanHolder ? (
          <PaymentPanel
            token={token}
            dues={dues}
            iban={client.iban}
            ibanDisplay={formatIban(client.iban)}
            holder={client.ibanHolder}
            reported={reported}
            today={todayISO(tz)}
          />
        ) : (
          dues.length > 0 && (
            <p className="rounded-xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
              Ödeme bilgileri için {trainerName} ile iletişime geçebilirsin.
            </p>
          )
        ))}

      {(packages.length > 0 || upcoming.length > 0) && (
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
      )}

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
