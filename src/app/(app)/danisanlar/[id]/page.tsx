import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  CalendarPlus,
  ChevronLeft,
  History,
  MessageCircle,
  MessagesSquare,
  Package,
  PackagePlus,
  Pencil,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listRecentPayments } from "@/db/payments";
import { listIntakeAnswers } from "@/db/intake";
import { getActivePortalLink } from "@/db/portal";
import { getTrainer } from "@/db/queries";
import { clientPackageBalances, clientPackages, clients, lessonAttendees, lessons } from "@/db/schema";
import {
  ATTENDANCE_LABELS,
  PAYMENT_METHOD_LABELS,
  SESSION_TYPE_LABELS,
  formatDayMonth,
  formatShortDate,
  formatTRY,
  formatTime,
  todayISO,
} from "@/lib/format";
import { formatAnswer } from "@/lib/intake";
import { installmentPlan, installmentStates, nextPayable } from "@/lib/installments";
import { portalUrl } from "@/lib/portal";
import { formatPhone, whatsappLink } from "@/lib/whatsapp";
import { ArchivedBanner } from "./archived-banner";
import { PortalCard } from "./portal-card";

export const metadata: Metadata = { title: "Danışan" };

const STATE_LABELS: Record<string, string> = {
  active: "Aktif",
  frozen: "Donduruldu",
  finished: "Bitti",
  expired: "Süresi doldu",
  cancelled: "İptal",
};

export default async function ClientPage({ params }: PageProps<"/danisanlar/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const data = await withTrainer(async (tx, trainerId) => {
    const [client] = await tx
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.trainerId, trainerId)));
    if (!client) return null;
    const packages = await tx
      .select({
        id: clientPackages.id,
        name: clientPackages.name,
        sessionType: clientPackages.sessionType,
        total: clientPackages.totalSessions,
        price: clientPackages.price,
        startsOn: clientPackages.startsOn,
        remaining: clientPackageBalances.remainingSessions,
        expiresOn: clientPackageBalances.effectiveExpiresOn,
        due: clientPackageBalances.dueAmount,
        overdue: clientPackageBalances.overdueAmount,
        paid: clientPackageBalances.paidAmount,
        installments: clientPackages.installments,
        state: clientPackageBalances.state,
      })
      .from(clientPackages)
      .innerJoin(clientPackageBalances, eq(clientPackageBalances.clientPackageId, clientPackages.id))
      .where(eq(clientPackages.clientId, id))
      .orderBy(desc(clientPackages.startsOn));
    const lessonRows = (when: "upcoming" | "past") =>
      tx
        .select({
          id: lessonAttendees.id,
          lessonId: lessons.id,
          startsAt: lessons.startsAt,
          sessionType: lessons.sessionType,
          status: lessonAttendees.status,
          makeupUsed: lessonAttendees.makeupUsed,
        })
        .from(lessonAttendees)
        .innerJoin(lessons, eq(lessons.id, lessonAttendees.lessonId))
        .where(
          and(
            eq(lessonAttendees.clientId, id),
            // Lessons the trainer cancelled never happened; leave them out of the history.
            eq(lessons.status, "scheduled"),
            when === "upcoming" ? gte(lessons.startsAt, sql`now()`) : lt(lessons.startsAt, sql`now()`),
          ),
        )
        .orderBy(when === "upcoming" ? asc(lessons.startsAt) : desc(lessons.startsAt))
        .limit(when === "upcoming" ? 5 : 10);
    const upcoming = await lessonRows("upcoming");
    const history = await lessonRows("past");
    const paymentHistory = await listRecentPayments(tx, trainerId, { clientId: id, limit: 10 });
    const portal = await getActivePortalLink(tx, id);
    const intake = await listIntakeAnswers(tx, { clientId: id });
    const { timezone } = await getTrainer(tx, trainerId);
    return { client, packages, upcoming, history, paymentHistory, portal, intake, timezone };
  });
  if (!data) notFound();

  const { client, packages, upcoming, history, paymentHistory, portal, intake, timezone } = data;
  const today = todayISO(timezone);
  // Answers are ordered oldest first, so the latest answer to each question wins.
  const latestAnswers = [...new Map(intake.map((a) => [a.fieldId ?? a.label, a])).values()].sort((a, b) => a.sortOrder - b.sortOrder);
  const totalDue = packages.filter((p) => p.state !== "cancelled").reduce((sum, p) => sum + Number(p.due), 0);
  const wa = whatsappLink(client.phone, `Merhaba ${client.fullName.split(" ")[0]},`);

  return (
    <>
      <Link
        href={client.archivedAt ? "/danisanlar/arsiv" : "/danisanlar"}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {client.archivedAt ? "Arşiv" : "Danışanlar"}
      </Link>
      <section aria-label="Danışan" className="mb-8 surface p-5">
        <div className="flex items-start gap-4">
          <Avatar name={client.fullName} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl leading-tight font-semibold">{client.fullName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[formatPhone(client.phone), client.goals].filter(Boolean).join(" · ") || "İletişim bilgisi yok"}
            </p>
          </div>
          {!client.archivedAt && (
            <Button asChild variant="outline" size="icon" aria-label="Düzenle">
              <Link href={`/danisanlar/${client.id}/duzenle`}>
                <Pencil />
              </Link>
            </Button>
          )}
        </div>
        {!client.archivedAt && (
          <div className="mt-5 border-t pt-4">
            {/* Five actions on a 375px phone: borrow a little of the card's padding so "WhatsApp" fits. */}
            <div className={`grid ${wa ? "-mx-2 grid-cols-5 gap-1 sm:mx-0 sm:gap-2" : "grid-cols-4 gap-2"}`}>
              <QuickAction href={`/danisanlar/${client.id}/paket-sat`} icon={<PackagePlus />} label="Paket sat" primary />
              <QuickAction href={`/ders/yeni?danisan=${client.id}&next=/danisanlar/${client.id}`} icon={<CalendarPlus />} label="Ders ekle" />
              <QuickAction
                href={`/odemeler/yeni?danisan=${client.id}&next=/danisanlar/${client.id}`}
                icon={<Wallet />}
                label={totalDue > 0 ? formatTRY(totalDue) : "Ödeme al"}
              />
              <QuickAction href={`/mesajlar/${client.id}`} icon={<MessagesSquare />} label="Mesaj" />
              {wa && <QuickAction href={wa} external icon={<MessageCircle />} label="WhatsApp" />}
            </div>
          </div>
        )}
      </section>
      {client.archivedAt && (
        <ArchivedBanner clientId={client.id} name={client.fullName} archivedOn={formatDayMonth(client.archivedAt, timezone)} />
      )}

      <section aria-labelledby="packages-heading" className="mb-8">
        <h2 id="packages-heading" className="mb-3 text-base font-semibold">
          Paketler
        </h2>
        {packages.length === 0 ? (
          <EmptyState icon={<Package />} title="Paket yok">
            Ders sayısını takip etmek için bir paket sat.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {packages.map((p) => (
              <li key={p.id} className="surface p-4">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {SESSION_TYPE_LABELS[p.sessionType]} · {formatShortDate(p.startsOn)}
                      {p.expiresOn && ` → ${formatShortDate(p.expiresOn)}`}
                    </p>
                  </div>
                  <Badge variant={p.state === "active" ? "lime" : "secondary"}>{STATE_LABELS[p.state]}</Badge>
                </div>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <p>
                    <span className="text-3xl font-semibold tracking-tight tabular-nums">{p.remaining}</span>
                    <span className="text-sm text-muted-foreground"> / {p.total} ders kaldı</span>
                  </p>
                  {Number(p.overdue) > 0 ? (
                    <span className="text-sm font-medium text-destructive-strong">{formatTRY(p.overdue)} vadesi geldi</span>
                  ) : (
                    Number(p.due) > 0 && <span className="text-sm text-muted-foreground">{formatTRY(p.due)} kalan</span>
                  )}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className="h-full rounded-full bg-lime" style={{ width: `${p.total > 0 ? (p.remaining / p.total) * 100 : 0}%` }} />
                </div>
                {p.installments > 1 && (
                  <div className="mt-3">
                    <InstallmentSummary pkg={p} today={today} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!client.archivedAt && (
        <div className="mb-8">
          <PortalCard
            clientId={client.id}
            clientName={client.fullName}
            phone={client.phone}
            url={portal ? portalUrl(portal.token) : null}
            lastOpened={
              portal?.lastUsedAt
                ? `${formatDayMonth(portal.lastUsedAt, timezone)} ${formatTime(portal.lastUsedAt, timezone)}`
                : null
            }
          />
        </div>
      )}

      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-heading" className="mb-8">
          <h2 id="upcoming-heading" className="mb-3 text-base font-semibold">
            Sıradaki dersler
          </h2>
          <ul className="divide-y overflow-hidden surface">
            {upcoming.map((h) => (
              <li key={h.id}>
                <Link href={`/ders/${h.lessonId}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50">
                  <span className="w-16 shrink-0 tabular-nums">{formatDayMonth(h.startsAt, timezone)}</span>
                  <span className="w-12 shrink-0 text-muted-foreground tabular-nums">{formatTime(h.startsAt, timezone)}</span>
                  <span className="flex-1 text-muted-foreground">{SESSION_TYPE_LABELS[h.sessionType]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="history-heading" className="mb-8">
        <h2 id="history-heading" className="mb-3 text-base font-semibold">
          Son dersler
        </h2>
        {history.length === 0 ? (
          <EmptyState icon={<History />} title="Henüz ders yok" />
        ) : (
          <ul className="divide-y overflow-hidden surface">
            {history.map((h) => (
              <li key={h.id}>
                <Link href={`/ders/${h.lessonId}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50">
                  <span className="w-16 shrink-0 tabular-nums">{formatDayMonth(h.startsAt, timezone)}</span>
                  <span className="w-12 shrink-0 text-muted-foreground tabular-nums">{formatTime(h.startsAt, timezone)}</span>
                  <span className="flex-1 text-muted-foreground">{SESSION_TYPE_LABELS[h.sessionType]}</span>
                  <Badge variant={h.status === "attended" ? "default" : h.status === "scheduled" ? "outline" : "secondary"}>
                    {ATTENDANCE_LABELS[h.status]}
                    {h.makeupUsed && " · telafi"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {paymentHistory.length > 0 && (
        <section aria-labelledby="payments-heading" className="mb-8">
          <h2 id="payments-heading" className="mb-3 text-base font-semibold">
            Ödemeler
          </h2>
          <ul className="divide-y overflow-hidden surface">
            {paymentHistory.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-16 shrink-0 tabular-nums">{formatShortDate(p.paidOn)}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {PAYMENT_METHOD_LABELS[p.method]}
                  {p.packageName && ` · ${p.packageName}`}
                </span>
                <span className="font-medium tabular-nums">{formatTRY(p.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="answers-heading" className="mb-8 surface p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="answers-heading" className="text-base font-semibold">
            Kayıt bilgileri
          </h2>
          {!client.archivedAt && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/danisanlar/${client.id}/kayit-bilgileri`}>
                <Pencil />
                {latestAnswers.length > 0 ? "Düzenle" : "Bilgi ekle"}
              </Link>
            </Button>
          )}
        </div>
        {latestAnswers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Boy, kilo, hedef gibi kayıt formu cevapları burada görünür.</p>
        ) : (
          <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            {latestAnswers.map((a) => (
              <div key={a.id}>
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  {a.label}
                  {a.isHealth && <ShieldCheck className="size-3.5" aria-label="Sağlık bilgisi" />}
                </dt>
                <dd className="mt-0.5 font-medium whitespace-pre-wrap">{formatAnswer(a)}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {(client.notes || client.healthNotes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notlar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {client.notes && <p className="whitespace-pre-wrap">{client.notes}</p>}
            {client.healthNotes && (
              <p className="whitespace-pre-wrap rounded-md bg-warning/10 px-3 py-2">
                <span className="font-medium">Sağlık: </span>
                {client.healthNotes}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function InstallmentSummary({
  pkg,
  today,
}: {
  pkg: { price: string; installments: number; startsOn: string; paid: string };
  today: string;
}) {
  const states = installmentStates(installmentPlan(Number(pkg.price), pkg.installments, pkg.startsOn), Number(pkg.paid), 0, today);
  const paid = states.filter((s) => s.status === "paid").length;
  const next = nextPayable(states);
  return (
    <p className="text-xs text-muted-foreground">
      {paid}/{states.length} taksit ödendi
      {next && (
        <span className={next.status === "overdue" ? "text-destructive-strong" : undefined}>
          {" "}
          · sıradaki {formatTRY(next.remaining)} · {formatShortDate(next.dueOn)}
        </span>
      )}
    </p>
  );
}

function QuickAction({
  href,
  icon,
  label,
  primary,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  external?: boolean;
}) {
  const circle = primary ? "bg-primary text-primary-foreground" : "bg-muted text-foreground";
  const content = (
    <>
      <span className={`flex size-12 items-center justify-center rounded-full ${circle} [&_svg]:size-5`}>{icon}</span>
      <span className="max-w-full truncate text-xs font-medium">{label}</span>
    </>
  );
  const className = "flex min-w-0 flex-col items-center gap-2 rounded-2xl py-1 transition-opacity hover:opacity-80";
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
