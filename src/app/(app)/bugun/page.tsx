import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Check, ClipboardCheck, CalendarPlus, MessageCircle, Sunrise, Users, Wallet } from "lucide-react";
import { StatTile } from "@/components/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionTitle } from "@/components/page-header";
import { withTrainer } from "@/db";
import { ApplicationsBanner, AttendanceBanner, PaymentsBanner } from "@/components/applications-banner";
import { countPendingApplications } from "@/db/applications";
import { LOST_AFTER_DAYS, lostClients, tomorrowAttendees } from "@/db/engagement";
import { ensureGroupOccurrences } from "@/db/groups";
import { countPendingAttendance, getLessons } from "@/db/lessons";
import { countPendingPayments, getPaymentSummary } from "@/db/payments";
import { getGuideFacts } from "@/db/guide";
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
import { siteUrl } from "@/lib/config";
import { buildGuide, guideMode } from "@/lib/guide";
import { portalUrl } from "@/lib/portal";
import { cn } from "@/lib/utils";
import { whenPhrase } from "@/lib/when";
import { messages, whatsappLink, withPortal } from "@/lib/whatsapp";
import { AttendanceRow } from "@/components/attendance-row";
import { Avatar } from "@/components/avatar";
import { takenPlaces } from "../takvim/lesson-summary";
import { GettingStarted, GuideComplete } from "./getting-started";

export const metadata: Metadata = { title: "Bugün" };

export default async function TodayPage() {
  const { trainer, lessons, alerts, portals, pending, pendingPayments, money, guideFacts, tomorrow, lost, unmarked } = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    // Sequential on purpose: a transaction runs on one connection.
    const today = todayISO(trainer.timezone);
    await ensureGroupOccurrences(tx, trainer);
    const lessons = await getLessons(tx, trainer, { from: today, to: today });
    const alerts = await getPackageAlerts(tx, trainer);
    const tomorrow = await tomorrowAttendees(tx, trainer);
    const lost = await lostClients(tx, trainer, 5);
    const unmarked = await countPendingAttendance(tx, trainer);
    const portals = await getActivePortalTokens(tx, [
      ...new Set([...alerts.map((a) => a.clientId), ...tomorrow.filter((t) => !t.confirmed).map((t) => t.clientId)]),
    ]);
    const pending = await countPendingApplications(tx, trainerId);
    const pendingPayments = await countPendingPayments(tx, trainerId);
    const money = await getPaymentSummary(tx, trainer);
    // Skip the checklist counts once the trainer has hidden it.
    const guideFacts = trainer.guideDismissedAt ? null : await getGuideFacts(tx, trainer);
    return { trainer, lessons, alerts, portals, pending, pendingPayments, money, guideFacts, tomorrow, lost, unmarked };
  });

  const now = new Date();
  const firstName = trainer.fullName.split(" ")[0];
  const live = lessons.filter((l) => l.lessonStatus === "scheduled");
  const next = live.find((l) => l.endsAt > now);
  const people = live.reduce((sum, l) => sum + l.attendees.filter((a) => a.status !== "cancelled").length, 0);
  const guide = guideFacts && buildGuide(guideFacts);
  const guideView = guide ? guideMode(guide, false) : "hidden";
  const pageUrl = trainer.publicPageEnabled && trainer.slug ? `${siteUrl()}/${trainer.slug}` : null;

  return (
    <>
      <PageHeader
        eyebrow={<span className="capitalize">{formatLongDate(now, trainer.timezone)}</span>}
        title={firstName ? `${greeting(now, trainer.timezone)}, ${firstName}` : greeting(now, trainer.timezone)}
      />

      {guide && guideView === "checklist" && <GettingStarted guide={guide} pageUrl={pageUrl} />}
      {guideView === "congrats" && <GuideComplete />}

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

      {(pending > 0 || pendingPayments > 0 || unmarked > 0) && (
        <div className="mb-6">
          <ApplicationsBanner count={pending} />
          <PaymentsBanner count={pendingPayments} />
          <AttendanceBanner count={unmarked} />
        </div>
      )}

      <section aria-labelledby="lessons-heading" className="mb-8">
        <SectionTitle
          id="lessons-heading"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/yoklama">
                <ClipboardCheck />
                Yoklama
              </Link>
            </Button>
          }
        >
          Bugünün dersleri
        </SectionTitle>
        {lessons.length === 0 ? (
          <EmptyState icon={<Sunrise />} title="Bugün planlı ders yok">
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/ders/yeni?next=/bugun">
                <CalendarPlus />
                Ders planla
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

      {tomorrow.length > 0 && (
        <section aria-labelledby="tomorrow-heading" className="mb-8">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="tomorrow-heading" className="text-base font-semibold">
              Yarın gelecekler
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {tomorrow.filter((t) => t.confirmed).length}/{tomorrow.length} onayladı
            </span>
          </div>
          <ul className="divide-y overflow-hidden surface">
            {tomorrow.map((t) => {
              const token = portals.get(t.clientId);
              const ask = t.confirmed
                ? null
                : whatsappLink(t.phone, withPortal(messages.confirmAsk(t.name, whenPhrase(t.startsAt, trainer.timezone)), token && portalUrl(token)));
              return (
                <li key={t.attendeeId} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={t.name} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/danisanlar/${t.clientId}`} className="block truncate font-medium hover:underline">
                      {t.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground tabular-nums">
                      {formatTime(t.startsAt, trainer.timezone)}
                      {t.title && <> · {t.title}</>}
                    </p>
                  </div>
                  {t.confirmed ? (
                    <Badge variant="success">
                      <Check aria-hidden />
                      Onayladı
                    </Badge>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground max-sm:sr-only">Yanıt bekleniyor</span>
                      {ask && (
                        <Button asChild size="icon" variant="outline" aria-label={`${t.name} için WhatsApp'tan onay iste`}>
                          <a href={ask} target="_blank" rel="noopener noreferrer">
                            <MessageCircle />
                          </a>
                        </Button>
                      )}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

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

      {lost.length > 0 && (
        <section aria-labelledby="lost-heading" className="mt-8">
          <h2 id="lost-heading" className="mb-1 text-base font-semibold">
            Bir süredir gelmeyenler
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">{LOST_AFTER_DAYS} günden uzun süredir dersi olmayan ve randevusu bulunmayan danışanlar.</p>
          <ul className="divide-y overflow-hidden surface">
            {lost.map((c) => {
              const href = whatsappLink(c.phone, messages.missYou(c.name));
              return (
                <li key={c.clientId} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/danisanlar/${c.clientId}`} className="block truncate font-medium hover:underline">
                      {c.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">Son ders {formatShortDate(c.lastLessonOn)}</p>
                  </div>
                  {href && (
                    <Button asChild size="icon" variant="outline" aria-label={`${c.name} ile WhatsApp'ta yazış`}>
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        <MessageCircle />
                      </a>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
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
