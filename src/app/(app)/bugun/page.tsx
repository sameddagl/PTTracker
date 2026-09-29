import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarPlus, MessageCircle, Sunrise } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getPackageAlerts, getTodayLessons, getTrainer, type PackageAlert } from "@/db/queries";
import {
  ATTENDANCE_LABELS,
  SESSION_TYPE_LABELS,
  formatLongDate,
  formatShortDate,
  formatTRY,
  formatTime,
  greeting,
} from "@/lib/format";
import { messages, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Bugün" };

export default async function TodayPage() {
  const { trainer, lessons, alerts } = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    // Sequential on purpose: a transaction runs on one connection.
    const lessons = await getTodayLessons(tx, trainer);
    const alerts = await getPackageAlerts(tx, trainer);
    return { trainer, lessons, alerts };
  });

  const now = new Date();
  const firstName = trainer.fullName.split(" ")[0];

  return (
    <>
      <PageHeader
        title={firstName ? `${greeting(now, trainer.timezone)}, ${firstName}` : greeting(now, trainer.timezone)}
        description={formatLongDate(now, trainer.timezone)}
      />

      <section aria-labelledby="lessons-heading" className="mb-8">
        <h2 id="lessons-heading" className="mb-3 text-sm font-medium text-muted-foreground">
          Bugünün dersleri
        </h2>
        {lessons.length === 0 ? (
          <EmptyState icon={<Sunrise />} title="Bugün planlı ders yok">
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/takvim">
                <CalendarPlus />
                Ders planla
              </Link>
            </Button>
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {lessons.map((l) => (
              <li key={l.lessonId}>
                <Card className="py-3">
                  <CardContent className="flex items-center gap-4 px-4">
                    <div className="w-12 shrink-0 text-center">
                      <div className="text-base font-semibold tabular-nums">{formatTime(l.startsAt, trainer.timezone)}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {formatTime(l.endsAt, trainer.timezone)}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {l.attendees.map((a) => a.name).join(", ") || l.title || "Ders"}
                      </p>
                      <p className="text-xs text-muted-foreground">{SESSION_TYPE_LABELS[l.sessionType]}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      {l.attendees.map((a) => (
                        <Badge key={a.id} variant={a.status === "scheduled" ? "outline" : "secondary"}>
                          {ATTENDANCE_LABELS[a.status]}
                        </Badge>
                      ))}
                    </div>
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
              <AlertRow key={a.clientPackageId} alert={a} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function AlertRow({ alert: a }: { alert: PackageAlert }) {
  const reasons: string[] = [];
  if (a.lowBalance) reasons.push(a.remaining === 0 ? "Paket bitti" : `${a.remaining} ders kaldı`);
  if (a.expiringSoon && a.expiresOn) reasons.push(`Son tarih ${formatShortDate(a.expiresOn)}`);
  if (a.hasDebt) reasons.push(`${formatTRY(a.due)} borç`);

  // One message per row: the most pressing reason wins.
  const text = a.lowBalance
    ? messages.lowBalance(a.clientName, a.remaining)
    : a.expiringSoon && a.expiresOn
      ? messages.expiring(a.clientName, formatShortDate(a.expiresOn))
      : messages.paymentDue(a.clientName, formatTRY(a.due));
  const href = whatsappLink(a.clientPhone, text);

  return (
    <li>
      <Card className="py-3">
        <CardContent className="flex items-center gap-3 px-4">
          <AlertTriangle className="size-4 shrink-0 text-amber-500" aria-hidden />
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
