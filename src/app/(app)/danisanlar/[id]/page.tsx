import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { CalendarPlus, ChevronLeft, History, MessageCircle, Package, PackagePlus, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listRecentPayments } from "@/db/payments";
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
} from "@/lib/format";
import { portalUrl } from "@/lib/portal";
import { formatPhone, whatsappLink } from "@/lib/whatsapp";
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
    const { timezone } = await getTrainer(tx, trainerId);
    return { client, packages, upcoming, history, paymentHistory, portal, timezone };
  });
  if (!data) notFound();

  const { client, packages, upcoming, history, paymentHistory, portal, timezone } = data;
  const totalDue = packages.filter((p) => p.state !== "cancelled").reduce((sum, p) => sum + Number(p.due), 0);
  const wa = whatsappLink(client.phone, `Merhaba ${client.fullName.split(" ")[0]},`);

  return (
    <>
      <Link
        href="/danisanlar"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Danışanlar
      </Link>
      <PageHeader
        title={client.fullName}
        description={[formatPhone(client.phone), client.goals].filter(Boolean).join(" · ") || undefined}
      />
      <div className="mb-8 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/danisanlar/${client.id}/paket-sat`}>
            <PackagePlus />
            Paket sat
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/ders/yeni?danisan=${client.id}&next=/danisanlar/${client.id}`}>
            <CalendarPlus />
            Ders ekle
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/odemeler/yeni?danisan=${client.id}&next=/danisanlar/${client.id}`}>
            <Wallet />
            Ödeme al{totalDue > 0 && ` · ${formatTRY(totalDue)}`}
          </Link>
        </Button>
        {wa && (
          <Button asChild variant="outline">
            <a href={wa} target="_blank" rel="noopener noreferrer">
              <MessageCircle />
              WhatsApp
            </a>
          </Button>
        )}
      </div>

      <section aria-labelledby="packages-heading" className="mb-8">
        <h2 id="packages-heading" className="mb-3 text-sm font-medium text-muted-foreground">
          Paketler
        </h2>
        {packages.length === 0 ? (
          <EmptyState icon={<Package />} title="Paket yok">
            Ders sayısını takip etmek için bir paket sat.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {packages.map((p) => (
              <li key={p.id}>
                <Card className="py-4">
                  <CardContent className="flex items-center gap-4 px-4">
                    <div className="text-center">
                      <div className="text-2xl font-semibold tabular-nums">{p.remaining}</div>
                      <div className="text-xs text-muted-foreground">/ {p.total}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {SESSION_TYPE_LABELS[p.sessionType]} · {formatShortDate(p.startsOn)}
                        {p.expiresOn && ` → ${formatShortDate(p.expiresOn)}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={p.state === "active" ? "default" : "secondary"}>{STATE_LABELS[p.state]}</Badge>
                      {Number(p.due) > 0 && (
                        <span className="text-xs text-destructive">{formatTRY(p.due)} borç</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mb-8">
        <PortalCard
          clientId={client.id}
          clientName={client.fullName}
          phone={client.phone}
          url={portal ? portalUrl(portal.token) : null}
          lastOpened={portal?.lastUsedAt ? `${formatDayMonth(portal.lastUsedAt, timezone)} ${formatTime(portal.lastUsedAt, timezone)}` : null}
        />
      </div>

      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-heading" className="mb-8">
          <h2 id="upcoming-heading" className="mb-3 text-sm font-medium text-muted-foreground">
            Sıradaki dersler
          </h2>
          <ul className="divide-y rounded-xl border">
            {upcoming.map((h) => (
              <li key={h.id}>
                <Link href={`/ders/${h.lessonId}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50">
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
        <h2 id="history-heading" className="mb-3 text-sm font-medium text-muted-foreground">
          Son dersler
        </h2>
        {history.length === 0 ? (
          <EmptyState icon={<History />} title="Henüz ders yok" />
        ) : (
          <ul className="divide-y rounded-xl border">
            {history.map((h) => (
              <li key={h.id}>
                <Link href={`/ders/${h.lessonId}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50">
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
          <h2 id="payments-heading" className="mb-3 text-sm font-medium text-muted-foreground">
            Ödemeler
          </h2>
          <ul className="divide-y rounded-xl border">
            {paymentHistory.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
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

      {(client.notes || client.healthNotes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notlar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {client.notes && <p className="whitespace-pre-wrap">{client.notes}</p>}
            {client.healthNotes && (
              <p className="whitespace-pre-wrap rounded-md bg-amber-500/10 px-3 py-2">
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
