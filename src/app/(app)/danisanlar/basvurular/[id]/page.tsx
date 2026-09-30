import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CheckCircle2, ChevronLeft, MessageCircle, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getApplication } from "@/db/applications";
import { listIntakeAnswers } from "@/db/intake";
import { getActivePortalLink } from "@/db/portal";
import { getTrainer } from "@/db/queries";
import { consents } from "@/db/schema";
import { SESSION_TYPE_LABELS, formatDayMonth, formatTRY, formatTime, todayISO } from "@/lib/format";
import { formatAnswer } from "@/lib/intake";
import { portalUrl } from "@/lib/portal";
import { applicationOption, optionLabel } from "@/lib/pricing";
import { formatPhone, whatsappLink } from "@/lib/whatsapp";
import { rejectApplicationAction } from "../actions";
import { ApproveForm } from "./approve-form";

export const metadata: Metadata = { title: "Başvuru" };

export default async function ApplicationPage({ params, searchParams }: PageProps<"/danisanlar/basvurular/[id]">) {
  const { id } = await params;
  const { onaylandi } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const data = await withTrainer(async (tx, trainerId) => {
    const app = await getApplication(tx, trainerId, id);
    if (!app) return null;
    const trainer = await getTrainer(tx, trainerId);
    const answers = await listIntakeAnswers(tx, { applicationId: id });
    const [health] = await tx
      .select({ id: consents.id })
      .from(consents)
      .where(and(eq(consents.clientId, app.clientId), eq(consents.kind, "health_data")))
      .limit(1);
    const link = await getActivePortalLink(tx, app.clientId);
    return { app, trainer, answers, hasHealthConsent: !!health, token: link?.token ?? null };
  });
  if (!data) notFound();

  const { app, trainer, answers, hasHealthConsent, token } = data;
  const tz = trainer.timezone;
  const approvedWa =
    app.status === "approved" && token
      ? whatsappLink(
          app.clientPhone,
          `Merhaba ${app.clientName.split(" ")[0]}, ${app.packageName} başvurunu onayladım! Paketini ve ödeme bilgilerini buradan görebilirsin: ${portalUrl(token)}`,
        )
      : null;

  const option = applicationOption(app);

  return (
    <>
      <Link
        href="/danisanlar/basvurular"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Başvurular
      </Link>
      <PageHeader
        title={app.clientName}
        description={`${formatDayMonth(app.createdAt, tz)} ${formatTime(app.createdAt, tz)} tarihinde başvurdu`}
      />

      {onaylandi && app.status === "approved" && (
        <Card className="mb-6 border-success/40 bg-success/10">
          <CardContent className="flex flex-col gap-3">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-4 text-success" aria-hidden />
              Onaylandı.{" "}
              {onaylandi === "eposta" ? "Danışana e-posta gönderildi." : "WhatsApp'tan haber vermeyi unutma."}
            </p>
            <div className="flex flex-wrap gap-2">
              {approvedWa && (
                <Button asChild size="sm">
                  <a href={approvedWa} target="_blank" rel="noopener noreferrer">
                    <MessageCircle />
                    WhatsApp&apos;tan haber ver
                  </a>
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <Link href={`/danisanlar/${app.clientId}`}>Danışana git</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paket</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">{app.packageName}</p>
              <p className="text-sm text-muted-foreground">
                {SESSION_TYPE_LABELS[app.sessionType]} · {app.sessionCount} ders
              </p>
            </div>
            {option && (
              <div className="text-right">
                <p className="text-xl font-semibold tabular-nums">{formatTRY(option.total)}</p>
                <p className="text-sm text-muted-foreground">{optionLabel(option)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">İletişim</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Telefon</dt>
              <dd>
                {app.clientPhone ? (
                  <a href={whatsappLink(app.clientPhone, `Merhaba ${app.clientName.split(" ")[0]},`) ?? "#"} className="underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
                    {formatPhone(app.clientPhone)}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
              <dt className="text-muted-foreground">E-posta</dt>
              <dd className="truncate">{app.clientEmail ?? "—"}</dd>
              {app.clientStatus === "active" && app.status === "pending" && (
                <>
                  <dt className="text-muted-foreground">Kayıt</dt>
                  <dd>
                    Zaten danışanın ·{" "}
                    <Link href={`/danisanlar/${app.clientId}`} className="underline underline-offset-2">
                      bilgilerine git
                    </Link>
                  </dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        {(answers.length > 0 || app.message) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Form cevapları</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {answers.length > 0 && (
                <dl className="flex flex-col gap-3 text-sm">
                  {answers.map((a) => (
                    <div key={a.id}>
                      <dt className="flex items-center gap-2 text-muted-foreground">
                        {a.label}
                        {a.isHealth && <ShieldCheck className="size-3.5 text-primary" aria-label="Sağlık bilgisi" />}
                      </dt>
                      <dd className="whitespace-pre-wrap">{formatAnswer(a)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {app.message && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Not</p>
                  <p className="whitespace-pre-wrap">{app.message}</p>
                </div>
              )}
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" aria-hidden />
                {hasHealthConsent ? "Sağlık bilgilerini paylaşmak için açık rıza verdi." : "Sağlık bilgilerini paylaşmaya rıza vermedi; bu sorular sorulmadı."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {app.status === "pending" ? (
        <section aria-label="Karar" className="flex flex-col gap-4">
          <ApproveForm id={app.id} today={todayISO(tz)} />
          <form action={rejectApplicationAction}>
            <input type="hidden" name="id" value={app.id} />
            <SubmitButton variant="ghost" className="text-destructive-strong hover:text-destructive-strong">
              <X />
              Reddet
            </SubmitButton>
          </form>
          <p className="text-xs text-muted-foreground">
            Onaylarsan {app.packageName} paketi danışana tanımlanır ve kendi sayfasında görünür.
          </p>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Badge variant={app.status === "approved" ? "default" : "secondary"}>
            {app.status === "approved" ? "Onaylandı" : "Reddedildi"}
          </Badge>
          {app.decidedAt && ` ${formatDayMonth(app.decidedAt, tz)}`}
        </p>
      )}
    </>
  );
}
