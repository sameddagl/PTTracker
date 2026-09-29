import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, CheckCircle2, Hourglass, Lock, MessageCircle, Minus } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ATTENDANCE_LABELS,
  formatDayMonth,
  formatShortDate,
  formatTRY,
  formatTime,
  todayISO,
} from "@/lib/format";
import { formatIban, paymentCode } from "@/lib/iban";
import { installmentPlan, installmentStates } from "@/lib/installments";
import { getPortalData, portalUrl } from "@/lib/portal";
import { applicationOption, optionLabel } from "@/lib/pricing";
import { BookingPanel, UpcomingLessons } from "./booking-panel";
import { GroupPanel } from "./group-panel";
import { PaymentPanel } from "./payment-panel";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

// Personal links must never be indexed or leak through referrers.
export const metadata: Metadata = { title: "Derslerim", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function PortalPage({ params, searchParams }: PageProps<"/p/[token]">) {
  const { token } = await params;
  const { yeni } = await searchParams;
  const data = await getPortalData(token);
  if (!data) notFound();

  const { client, packages, upcoming, recent, application, reported, booking, bookable, groups } = data;
  const tz = client.timezone;
  const trainerName = client.businessName || client.trainerName;
  const url = portalUrl(token);
  const toTrainer = whatsappLink(
    client.trainerPhone,
    `Merhaba, ${application?.packageName ?? "paket"} için başvurdum. Sayfam: ${url}`,
  );
  const pending = application?.status === "pending";
  const pendingOption = pending ? applicationOption(application) : null;
  const today = todayISO(tz);
  const plans = packages
    .map((p) => ({
      id: p.id,
      name: p.name,
      code: paymentCode(client.fullName, p.id),
      states: installmentStates(
        installmentPlan(Number(p.price), p.installments, p.startsOn),
        Number(p.paid),
        reported.filter((r) => r.status === "pending" && r.clientPackageId === p.id).reduce((sum, r) => sum + Number(r.amount), 0),
        today,
      ),
    }))
    // Nothing to show for free packages or ones paid in full.
    .filter((p) => p.states.some((s) => s.status !== "paid"));
  const rejected = reported.filter((r) => r.status === "rejected");

  return (
    <div className="min-h-dvh bg-canvas">
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-4 pt-6 pb-8">
        <header className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar name={trainerName} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{trainerName}</p>
              <p className="text-xs text-muted-foreground">Kişisel ders sayfan</p>
            </div>
          </div>
          <h1 className="text-3xl font-semibold">Merhaba {client.fullName.split(" ")[0]}</h1>
        </header>

        {yeni && (
          <div className="flex flex-col gap-3 rounded-2xl bg-lime p-5 text-lime-foreground">
            <p className="flex items-center gap-2 text-base font-semibold">
              <CheckCircle2 className="size-5" aria-hidden />
              Başvurun alındı
            </p>
            <p className="text-sm opacity-80">
              Bu sayfa senin kişisel sayfan. Paketini, derslerini ve ödeme bilgilerini buradan takip edeceksin. Kaybetmemek için
              linki kendine kaydet ya da eğitmenine gönder.
            </p>
            {toTrainer && (
              <Button asChild className="h-auto min-h-11 bg-[#1d1d1f] py-2.5 whitespace-normal text-white hover:bg-[#1d1d1f]/85">
                <a href={toTrainer} target="_blank" rel="noopener noreferrer">
                  <MessageCircle />
                  Linki WhatsApp&apos;tan {trainerName}&apos;a gönder
                </a>
              </Button>
            )}
          </div>
        )}

        {pending && (
          <div className="flex items-center gap-4 surface p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning-strong">
              <Hourglass className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{application.packageName}</p>
              <p className="text-sm text-muted-foreground">Eğitmenin onayı bekleniyor. Onaylanınca sana haber vereceğiz.</p>
            </div>
            {pendingOption && (
              <span className="shrink-0 text-right">
                <span className="block font-semibold tabular-nums">{formatTRY(pendingOption.total)}</span>
                <span className="block text-xs text-muted-foreground">{optionLabel(pendingOption)}</span>
              </span>
            )}
          </div>
        )}

        {application?.status === "rejected" && packages.length === 0 && (
          <p className="rounded-2xl border border-dashed bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
            Başvurun şu an kabul edilemedi. Detaylar için {trainerName} ile iletişime geçebilirsin.
          </p>
        )}

        {pending || (application?.status === "rejected" && packages.length === 0) ? null : packages.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
            Şu an aktif paketin yok.
          </p>
        ) : (
          <section aria-label="Paketlerin" className="flex flex-col gap-3">
            {packages.map((p) => (
              <article key={p.id} className="flex flex-col gap-5 surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="eyebrow">Paketin</p>
                    <h2 className="truncate text-base font-semibold">{p.name}</h2>
                  </div>
                  {p.state === "frozen" && <Badge variant="secondary">Donduruldu</Badge>}
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-6xl leading-none font-semibold tracking-tight tabular-nums">{p.remaining}</span>
                  <span className="pb-1 text-sm text-muted-foreground">
                    / {p.total} ders
                    <br />
                    kaldı
                  </span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={p.total}
                  aria-valuenow={p.remaining}
                  aria-label="Kalan ders"
                >
                  <div
                    className="h-full rounded-full bg-lime"
                    style={{ width: `${p.total > 0 ? (p.remaining / p.total) * 100 : 0}%` }}
                  />
                </div>
                {(p.expiresOn || Number(p.due) > 0) && (
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {p.expiresOn && (
                      <div className="rounded-xl bg-muted/60 px-3 py-2.5">
                        <dt className="text-xs text-muted-foreground">Son tarih</dt>
                        <dd className="mt-0.5 font-semibold">{formatShortDate(p.expiresOn)}</dd>
                      </div>
                    )}
                    {Number(p.due) > 0 && (
                      <div className="rounded-xl bg-muted/60 px-3 py-2.5">
                        <dt className="text-xs text-muted-foreground">Kalan ödeme</dt>
                        <dd className="mt-0.5 font-semibold tabular-nums">{formatTRY(p.due)}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </article>
            ))}
          </section>
        )}

        {(plans.length > 0 || rejected.length > 0) &&
          (client.iban && client.ibanHolder ? (
            <PaymentPanel
              token={token}
              plans={plans}
              iban={client.iban}
              ibanDisplay={formatIban(client.iban)}
              holder={client.ibanHolder}
              rejected={rejected}
            />
          ) : (
            plans.length > 0 && (
              <p className="rounded-2xl border border-dashed bg-card/50 px-4 py-4 text-sm text-muted-foreground">
                Ödeme bilgileri için {trainerName} ile iletişime geçebilirsin.
              </p>
            )
          ))}

        {booking?.enabled && booking.packages.length > 0 && (
          <BookingPanel
            token={token}
            days={booking.days}
            lessonMinutes={booking.lessonMinutes}
            credits={booking.packages.reduce((sum, p) => sum + p.free, 0)}
          />
        )}

        {/* Only for clients group classes are for: a group package, a fixed place, or a booking already. */}
        {groups && groups.slots.length > 0 && (groups.credits > 0 || groups.fixed.length > 0 || groups.slots.some((sl) => sl.joined)) && (
          <GroupPanel token={token} timezone={tz} credits={groups.credits} fixed={groups.fixed} slots={groups.slots} />
        )}

        {(packages.length > 0 || upcoming.length > 0) && (
          <UpcomingLessons token={token} lessons={bookable} timezone={tz} lateCancelHours={booking?.lateCancelHours ?? 24} />
        )}

        {recent.length > 0 && (
          <section aria-labelledby="recent-heading">
            <h2 id="recent-heading" className="mb-3 text-base font-semibold">
              Son derslerin
            </h2>
            <ul className="divide-y overflow-hidden surface text-sm">
              {recent.map((l) => {
                const attended = l.status === "attended";
                return (
                  <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        attended ? "bg-success/10 text-success-strong" : "bg-muted text-muted-foreground",
                      )}
                      aria-hidden
                    >
                      {attended ? <Check className="size-4" /> : <Minus className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium tabular-nums">{formatDayMonth(l.startsAt, tz)}</span>
                      <span className="block text-xs text-muted-foreground tabular-nums">{formatTime(l.startsAt, tz)}</span>
                    </span>
                    <span className={cn("text-right text-sm", attended ? "font-medium" : "text-muted-foreground")}>
                      {l.makeupUsed ? "Geç iptal (telafi)" : ATTENDANCE_LABELS[l.status]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <footer className="mt-auto flex items-center justify-center gap-1.5 pt-4 text-center text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          Bu sayfa sadece sana özel. Linki başkasıyla paylaşma.
        </footer>
      </main>
    </div>
  );
}
