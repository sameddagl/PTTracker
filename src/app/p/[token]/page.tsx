import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bell, Check, CheckCircle2, Hourglass, Lock, Minus } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { Avatar } from "@/components/avatar";
import { InstallCard } from "@/components/install-guide";
import { NotifyPrefsForm } from "@/components/notify-prefs-form";
import { PushToggle } from "@/components/push-toggle";
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
import { prefsView } from "@/lib/notify-prefs";
import { getPortalData, portalUrl } from "@/lib/portal";
import { applicationOption, optionLabel } from "@/lib/pricing";
import { NextLessonPrompt, UpcomingLessons } from "./booking-panel";
import { PortalTabs } from "./portal-tabs";
import { ProgressTab } from "./progress-tab";
import { NutritionTab, ProgramTab } from "./program-tab";
import { LessonPicker } from "./lesson-picker";
import { PackageShop } from "./package-shop";
import { MessageThread } from "./message-thread";
import { PaymentPanel } from "./payment-panel";
import { saveClientPrefsAction, subscribeClientAction, unsubscribeClientAction } from "./push-actions";
import { RenewalOffer } from "./renewal-offer";
import { cn } from "@/lib/utils";
import { whenPhrase } from "@/lib/when";
import { whatsappLink } from "@/lib/whatsapp";

// Personal links must never be indexed or leak through referrers.
export async function generateMetadata({ params }: PageProps<"/p/[token]">): Promise<Metadata> {
  const { token } = await params;
  return {
    title: "Derslerim",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
    // "Ana ekrana ekle" opens this page, not the trainer app.
    manifest: `/p/${token}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: "Derslerim", statusBarStyle: "default" },
  };
}

/** The next booking the client hasn't answered for, once it's within `hours` of starting. */
function lessonToAnswer<L extends { startsAt: Date; confirmed: boolean }>(lessons: L[], hours: number, now = Date.now()) {
  return lessons.find((l) => !l.confirmed && l.startsAt.getTime() - now <= hours * 3_600_000);
}

export default async function PortalPage({ params, searchParams }: PageProps<"/p/[token]">) {
  const { token } = await params;
  const { yeni } = await searchParams;
  const data = await getPortalData(token);
  if (!data) notFound();

  const { client, packages, upcoming, recent, application, pendingApplications, offers, renewable, messages, reported, booking, bookable, groups, progress, workout, nutrition } = data;
  const unreadFromTrainer = messages.filter((m) => m.sender === "trainer" && !m.readAt).length;
  const tz = client.timezone;
  const trainerName = client.businessName || client.trainerName;
  const url = portalUrl(token);
  const toTrainer = whatsappLink(
    client.trainerPhone,
    `Merhaba, ${application?.packageName ?? "paket"} için başvurdum. Sayfam: ${url}`,
  );
  const turnedDown = application?.status === "rejected" && packages.length === 0 && pendingApplications.length === 0;
  // Local date/time of each group class for the day strip.
  const localDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
  const priv =
    booking?.enabled && booking.packages.length > 0
      ? { days: booking.days, lessonMinutes: booking.lessonMinutes, credits: booking.packages.reduce((sum, p) => sum + p.free, 0) }
      : null;
  // Only for clients group classes are for: a group package, a fixed place, or a booking already.
  const group =
    groups && groups.slots.length > 0 && (groups.credits > 0 || groups.fixed.length > 0 || groups.slots.some((sl) => sl.joined))
      ? {
          credits: groups.credits,
          fixed: groups.fixed,
          slots: groups.slots.map((sl) => ({
            lessonId: sl.lessonId,
            title: sl.title,
            date: localDate(sl.startsAt),
            start: formatTime(sl.startsAt, tz),
            end: formatTime(sl.endsAt, tz),
            capacity: sl.capacity,
            taken: sl.taken,
            joined: sl.joined,
            canJoin: sl.canJoin,
          })),
        }
      : null;
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
  // The reminder's question waits at the top once the lesson is within the trainer's reminder window.
  const answer = lessonToAnswer(bookable, client.reminderHours);
  const answerWhen = answer ? whenPhrase(answer.startsAt, tz) : "";

  return (
    <div className="min-h-dvh bg-canvas">
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <header className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar name={trainerName} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{trainerName}</p>
              <p className="text-xs text-muted-foreground">Kişisel ders sayfan</p>
            </div>
            <a
              href="#bildirimler"
              aria-label="Bildirim ayarları"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-card hover:text-foreground"
            >
              <Bell className="size-5" aria-hidden />
            </a>
          </div>
          <h1 className="text-3xl font-semibold">Merhaba {client.fullName.split(" ")[0]}</h1>
        </header>

        {answer && (
          <NextLessonPrompt
            token={token}
            lesson={answer}
            when={answerWhen.charAt(0).toLocaleUpperCase("tr") + answerWhen.slice(1)}
            timezone={tz}
            lateCancelHours={client.lateCancelHours}
          />
        )}

        <PortalTabs
          tabs={[
            { id: "dersler", label: "Derslerim", anchors: ["dersler", "paketler", "odeme"] },
            { id: "ilerleme", label: "İlerlemem" },
            ...(workout ? [{ id: "program" as const, label: "Programım" }] : []),
            ...(nutrition ? [{ id: "beslenme" as const, label: "Beslenme" }] : []),
            { id: "mesajlar", label: "Mesajlar", badge: unreadFromTrainer },
            { id: "bildirimler", label: "Bildirimler", offBar: true },
          ]}
          panels={{
            dersler: (
              <>
                <InstallCard
                  storageKey="install-card-client"
                  title="Bu sayfayı telefonuna ekle"
                  description="Linki her seferinde aramadan ana ekrandan aç. Ders hatırlatmaları ve eğitmeninin mesajları telefonuna bildirim olarak düşsün."
                  appName="Derslerim"
                  url={url}
                  notifyWhere="sağ üstteki zil simgesinde"
                  push={{
                    subscribe: subscribeClientAction.bind(null, token),
                    unsubscribe: unsubscribeClientAction.bind(null, token),
                    description: "Ders hatırlatmaları, ödeme onayları ve eğitmeninin mesajları bu telefona gelsin.",
                  }}
                />

                {yeni && (
                  <div className="flex flex-col gap-3 rounded-2xl bg-lime p-5 text-lime-foreground">
                    <p className="flex items-center gap-2 text-base font-semibold">
                      <CheckCircle2 className="size-5" aria-hidden />
                      Başvurun alındı
                    </p>
                    <p className="text-sm opacity-80">
                      Bu sayfa sana özel. Paketini, derslerini ve ödemelerini buradan görürsün. Linki kaybetmemek için kendine kaydet ya da
                      eğitmenine gönder.
                    </p>
                    {toTrainer && (
                      <Button asChild className="h-auto min-h-11 bg-[#1d1d1f] py-2.5 whitespace-normal text-white hover:bg-[#1d1d1f]/85">
                        <a href={toTrainer} target="_blank" rel="noopener noreferrer">
                          <WhatsAppIcon />
                          Linki WhatsApp&apos;tan eğitmenine gönder
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {pendingApplications.map((app) => {
                  const option = applicationOption(app);
                  return (
                    <div key={app.id} className="flex items-center gap-4 surface p-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning-strong">
                        <Hourglass className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{app.packageName}</p>
                        <p className="text-sm text-muted-foreground">Eğitmenin onayladığında sana haber vereceğiz.</p>
                      </div>
                      {option && (
                        <span className="shrink-0 text-right">
                          <span className="block font-semibold tabular-nums">{formatTRY(option.total)}</span>
                          <span className="block text-xs text-muted-foreground">{optionLabel(option)}</span>
                        </span>
                      )}
                    </div>
                  );
                })}

                {turnedDown && (
                  <p className="rounded-2xl border border-dashed bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
                    Başvurun şimdilik onaylanmadı. Nedenini eğitmenine sorabilirsin.
                  </p>
                )}

                {turnedDown || (pendingApplications.length > 0 && packages.length === 0) ? null : packages.length === 0 ? (
                  <p className="rounded-2xl border border-dashed bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
                    Şu an aktif paketin yok.
                  </p>
                ) : (
                  <section id="paketler" aria-label="Paketlerin" className="flex scroll-mt-6 flex-col gap-3">
                    {packages.map((p) => {
                      const renew = renewable.find((r) => r.clientPackageId === p.id);
                      const renewPending = renew && pendingApplications.some((a) => a.templateId === renew.templateId);
                      return (
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
                        {renew &&
                          (renewPending ? (
                            <p className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
                              <Hourglass className="size-4 shrink-0" aria-hidden />
                              Yenileme isteğin eğitmeninin onayını bekliyor.
                            </p>
                          ) : (
                            <RenewalOffer
                              token={token}
                              templateId={renew.templateId}
                              installments={renew.installments}
                              reason={renew.remaining <= 0 ? "Paketindeki dersler bitti." : renew.remaining <= 2 ? `${renew.remaining} dersin kaldı.` : "Paketinin süresi bitiyor."}
                            />
                          ))}
                      </article>
                      );
                    })}
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
                        Havale bilgilerini eğitmenine sorabilirsin.
                      </p>
                    )
                  ))}

                {(priv || group) && <LessonPicker token={token} priv={priv} group={group} />}

                <PackageShop
                  token={token}
                  offers={offers}
                  pendingIds={pendingApplications.map((a) => a.templateId)}
                  hasPackage={packages.length > 0 || pendingApplications.length > 0}
                />

                {(packages.length > 0 || upcoming.length > 0) && (
                  <UpcomingLessons token={token} lessons={bookable} timezone={tz} lateCancelHours={client.lateCancelHours} />
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
              </>
            ),
            ilerleme: (
              <ProgressTab
                token={token}
                consented={progress.consented}
                selfWeigh={progress.selfWeigh}
                series={progress.series}
                today={todayISO(tz)}
                trainerName={trainerName}
                notes={progress.notes.map((n) => ({ id: n.id, body: n.body, when: formatDayMonth(n.createdAt, tz) }))}
              />
            ),
            program: workout && (
              <ProgramTab token={token} program={workout.program} checkins={workout.checkins} today={todayISO(tz)} trainerName={trainerName.split(" ")[0]} />
            ),
            beslenme: nutrition && <NutritionTab program={nutrition.program} pdfHref={`/p/${token}/beslenme-pdf`} />,
            mesajlar: (
              <MessageThread token={token} initial={messages} trainerName={trainerName} timeZone={tz} />
            ),
            bildirimler: (
              <section aria-labelledby="notify-heading" className="flex flex-col gap-3">
                <h2 id="notify-heading" className="text-base font-semibold">
                  Bildirim ayarları
                </h2>
                <PushToggle
                  subscribe={subscribeClientAction.bind(null, token)}
                  unsubscribe={unsubscribeClientAction.bind(null, token)}
                  description="Ders hatırlatmaları, ödeme onayları ve eğitmeninin mesajları bu telefona gelsin."
                />
                <NotifyPrefsForm rows={prefsView("client", client.notifyPrefs)} save={saveClientPrefsAction.bind(null, token)} />
                <p className="text-xs text-muted-foreground">Başvuru ve onay e-postaları her zaman gelir, çünkü içlerinde bu sayfanın linki var.</p>
              </section>
            ),
          }}
        />

        <footer className="mt-auto flex items-center justify-center gap-1.5 pt-4 text-center text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          Bu sayfa sana özel, linki kimseyle paylaşma.
        </footer>
      </main>
    </div>
  );
}
