import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarPlus, MessageCircle, Sunrise } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { ApplicationsBanner, PaymentsBanner } from "@/components/applications-banner";
import { countPendingApplications } from "@/db/applications";
import { ensureGroupOccurrences } from "@/db/groups";
import { getLessons } from "@/db/lessons";
import { countPendingPayments } from "@/db/payments";
import { getActivePortalTokens } from "@/db/portal";
import { getPackageAlerts, getTrainer, type PackageAlert } from "@/db/queries";
import {
  SESSION_TYPE_LABELS,
  formatLongDate,
  formatShortDate,
  formatTRY,
  formatTime,
  greeting,
  todayISO,
} from "@/lib/format";
import { portalUrl } from "@/lib/portal";
import { messages, whatsappLink, withPortal } from "@/lib/whatsapp";
import { AttendanceRow } from "@/components/attendance-row";
import { lessonTitle } from "../takvim/lesson-summary";

export const metadata: Metadata = { title: "Bugün" };

export default async function TodayPage() {
  const { trainer, lessons, alerts, portals, pending, pendingPayments } = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    // Sequential on purpose: a transaction runs on one connection.
    const today = todayISO(trainer.timezone);
    await ensureGroupOccurrences(tx, trainer);
    const lessons = await getLessons(tx, trainer, { from: today, to: today });
    const alerts = await getPackageAlerts(tx, trainer);
    const portals = await getActivePortalTokens(tx, [...new Set(alerts.map((a) => a.clientId))]);
    const pending = await countPendingApplications(tx, trainerId);
    const pendingPayments = await countPendingPayments(tx, trainerId);
    return { trainer, lessons, alerts, portals, pending, pendingPayments };
  });

  const now = new Date();
  const firstName = trainer.fullName.split(" ")[0];

  return (
    <>
      <PageHeader
        title={firstName ? `${greeting(now, trainer.timezone)}, ${firstName}` : greeting(now, trainer.timezone)}
        description={formatLongDate(now, trainer.timezone)}
        action={
          <Button asChild>
            <Link href="/ders/yeni?next=/bugun">
              <CalendarPlus />
              <span className="max-sm:sr-only">Ders ekle</span>
            </Link>
          </Button>
        }
      />

      {(pending > 0 || pendingPayments > 0) && (
        <div className="mb-6">
          <ApplicationsBanner count={pending} />
          <PaymentsBanner count={pendingPayments} />
        </div>
      )}

      <section aria-labelledby="lessons-heading" className="mb-8">
        <h2 id="lessons-heading" className="mb-3 text-sm font-medium text-muted-foreground">
          Bugünün dersleri
        </h2>
        {lessons.length === 0 ? (
          <EmptyState icon={<Sunrise />} title="Bugün planlı ders yok">
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/ders/yeni?next=/bugun">
                <CalendarPlus />
                Ders ekle
              </Link>
            </Button>
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {lessons.map((l) => (
              <li key={l.lessonId}>
                <Card className="gap-3 py-4">
                  <CardContent className="flex flex-col gap-4 px-4">
                    <Link href={`/ders/${l.lessonId}`} className="flex items-baseline gap-2 hover:underline">
                      <span className="text-base font-semibold tabular-nums">
                        {formatTime(l.startsAt, trainer.timezone)}–{formatTime(l.endsAt, trainer.timezone)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {l.groupClassId ? lessonTitle(l) : SESSION_TYPE_LABELS[l.sessionType]}
                      </span>
                    </Link>
                    {l.attendees.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{l.groupClassId ? "Henüz katılan yok" : l.title || "Danışan eklenmemiş"}</p>
                    ) : (
                      l.attendees.map((a) => <AttendanceRow key={a.id} attendee={a} />)
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="alerts-heading">
        <h2 id="alerts-heading" className="mb-3 text-sm font-medium text-muted-foreground">
          Dikkat edilecekler
        </h2>
        {alerts.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Biten paket, yaklaşan son tarih ya da bekleyen ödeme yok.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {alerts.map((a) => (
              <AlertRow key={a.clientPackageId} alert={a} portalToken={portals.get(a.clientId)} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function AlertRow({ alert: a, portalToken }: { alert: PackageAlert; portalToken?: string }) {
  const reasons: string[] = [];
  if (a.lowBalance) reasons.push(a.remaining === 0 ? "Paket bitti" : `${a.remaining} ders kaldı`);
  if (a.expiringSoon && a.expiresOn) reasons.push(`Son tarih ${formatShortDate(a.expiresOn)}`);
  if (a.hasDebt) reasons.push(`${formatTRY(a.overdue)} ödeme bekleniyor`);

  // One message per row: the most pressing reason wins.
  const text = a.lowBalance
    ? messages.lowBalance(a.clientName, a.remaining)
    : a.expiringSoon && a.expiresOn
      ? messages.expiring(a.clientName, formatShortDate(a.expiresOn))
      : messages.paymentDue(a.clientName, formatTRY(a.overdue));
  const href = whatsappLink(a.clientPhone, withPortal(text, portalToken && portalUrl(portalToken)));

  return (
    <li>
      <Card className="py-3">
        <CardContent className="flex items-center gap-3 px-4">
          <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
          <div className="min-w-0 flex-1">
            <Link href={`/danisanlar/${a.clientId}`} className="block truncate font-medium hover:underline">
              {a.clientName}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {a.packageName} · {reasons.join(" · ")}
            </p>
          </div>
          {href && (
            <Button asChild size="icon" variant="ghost" aria-label={`${a.clientName} ile WhatsApp'ta yazış`}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                <MessageCircle />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
