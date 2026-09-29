import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarClock, CalendarPlus, MessageCircle, Sunrise, Users, Wallet } from "lucide-react";
import { StatTile } from "@/components/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { ApplicationsBanner, PaymentsBanner } from "@/components/applications-banner";
import { countPendingApplications } from "@/db/applications";
import { ensureGroupOccurrences } from "@/db/groups";
import { getLessons } from "@/db/lessons";
import { countPendingPayments, getPaymentSummary } from "@/db/payments";
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
import { cn } from "@/lib/utils";
import { messages, whatsappLink, withPortal } from "@/lib/whatsapp";
import { AttendanceRow } from "@/components/attendance-row";
import { Avatar } from "@/components/avatar";
import { takenPlaces } from "../takvim/lesson-summary";

export const metadata: Metadata = { title: "Bugün" };

export default async function TodayPage() {
  const { trainer, lessons, alerts, portals, pending, pendingPayments, money } = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    // Sequential on purpose: a transaction runs on one connection.
    const today = todayISO(trainer.timezone);
    await ensureGroupOccurrences(tx, trainer);
    const lessons = await getLessons(tx, trainer, { from: today, to: today });
    const alerts = await getPackageAlerts(tx, trainer);
    const portals = await getActivePortalTokens(tx, [...new Set(alerts.map((a) => a.clientId))]);
    const pending = await countPendingApplications(tx, trainerId);
    const pendingPayments = await countPendingPayments(tx, trainerId);
    const money = await getPaymentSummary(tx, trainer);
    return { trainer, lessons, alerts, portals, pending, pendingPayments, money };
  });

  const now = new Date();
  const firstName = trainer.fullName.split(" ")[0];
  const live = lessons.filter((l) => l.lessonStatus === "scheduled");
  const next = live.find((l) => l.endsAt > now);
  const people = live.reduce((sum, l) => sum + l.attendees.filter((a) => a.status !== "cancelled").length, 0);

  return (
    <>
      <PageHeader
        eyebrow={<span className="capitalize">{formatLongDate(now, trainer.timezone)}</span>}
        title={firstName ? `${greeting(now, trainer.timezone)}, ${firstName}` : greeting(now, trainer.timezone)}
        action={
          <Button asChild>
            <Link href="/ders/yeni?next=/bugun">
              <CalendarPlus />
              <span className="max-sm:sr-only">Ders ekle</span>
            </Link>
          </Button>
        }
      />

      <section aria-label="Özet" className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          tone="ink"
          label="Bugün"
          value={`${live.length} ders`}
          hint={next ? `Sıradaki ${formatTime(next.startsAt, trainer.timezone)}` : live.length > 0 ? "Hepsi bitti" : "Boş gün"}
          icon={<CalendarClock />}
        />
        <StatTile label="Katılımcı" value={people} hint="bugünkü derslerde" icon={<Users />} />
        <StatTile
          className="col-span-2 sm:col-span-1"
          tone={money.overdue > 0 ? "lime" : "default"}
          label="Bekleyen alacak"
          value={formatTRY(money.outstanding)}
          hint={money.overdue > 0 ? `${formatTRY(money.overdue)} vadesi geldi` : `Bu ay ${formatTRY(money.thisMonth)} tahsil edildi`}
          icon={<Wallet />}
          href="/odemeler"
        />
      </section>

      {(pending > 0 || pendingPayments > 0) && (
        <div className="mb-6">
          <ApplicationsBanner count={pending} />
          <PaymentsBanner count={pendingPayments} />
        </div>
      )}

      <section aria-labelledby="lessons-heading" className="mb-8">
        <h2 id="lessons-heading" className="mb-3 text-base font-semibold">
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
          <ol className="flex flex-col gap-3">
            {lessons.map((l) => {
              const done = l.endsAt <= now;
              const current = !done && l.startsAt <= now;
              return (
                <li key={l.lessonId} className="sm:grid sm:grid-cols-[3.5rem_1fr] sm:gap-3">
                  <div className="hidden pt-4 text-right sm:block">
                    <p className={cn("text-sm font-semibold tabular-nums", done && "text-muted-foreground")}>
                      {formatTime(l.startsAt, trainer.timezone)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">{formatTime(l.endsAt, trainer.timezone)}</p>
                  </div>
                  <div className={cn("relative overflow-hidden surface p-4 pl-5", current && "ring-2 ring-lime")}>
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-y-3 left-0 w-1 rounded-r-full",
                        l.lessonStatus === "cancelled" ? "bg-border" : current ? "bg-lime" : done ? "bg-success" : "bg-foreground",
                      )}
                    />
                    <Link href={`/ders/${l.lessonId}`} className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 hover:underline">
                      <span className="font-semibold tabular-nums sm:hidden">
                        {formatTime(l.startsAt, trainer.timezone)}–{formatTime(l.endsAt, trainer.timezone)}
                      </span>
                      <span className="font-semibold max-sm:font-normal max-sm:text-muted-foreground">{l.groupClassId ? (l.title ?? "Grup dersi") : SESSION_TYPE_LABELS[l.sessionType]}</span>
                      {current && <Badge variant="lime">Şimdi</Badge>}
                      {l.groupClassId && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {takenPlaces(l)}/{l.capacity}
                        </span>
                      )}
                    </Link>
                    {l.attendees.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{l.groupClassId ? "Henüz katılan yok" : l.title || "Danışan eklenmemiş"}</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {l.attendees.map((a) => (
                          <AttendanceRow key={a.id} attendee={a} />
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="alerts-heading">
        <h2 id="alerts-heading" className="mb-3 text-base font-semibold">
          Dikkat edilecekler
        </h2>
        {alerts.length === 0 ? (
          <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Biten paket, yaklaşan son tarih ya da bekleyen ödeme yok.
          </p>
        ) : (
          <ul className="divide-y overflow-hidden surface">
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
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="relative">
        <Avatar name={a.clientName} />
        <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-card">
          <AlertTriangle className="size-3 text-warning-strong" aria-hidden />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <Link href={`/danisanlar/${a.clientId}`} className="block truncate font-medium hover:underline">
          {a.clientName}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {a.packageName} · {reasons.join(" · ")}
        </p>
      </div>
      {href && (
        <Button asChild size="icon" variant="outline" aria-label={`${a.clientName} ile WhatsApp'ta yazış`}>
          <a href={href} target="_blank" rel="noopener noreferrer">
            <MessageCircle />
          </a>
        </Button>
      )}
    </li>
  );
}
