import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ArrowRight, AtSign, CalendarDays, Check, Clock, MapPin, MessageCircle, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/price-tag";
import { WEEKDAY_LABELS, weekdayList } from "@/lib/dates";
import { SESSION_TYPE_LABELS, formatTRY } from "@/lib/format";
import { discountPercent, monthlyAmount, paymentOptions } from "@/lib/pricing";
import { getPublicPage, type PublicPage } from "@/lib/public-page";
import { APP_NAME, siteUrl } from "@/lib/config";
import { profileImageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

const DISCIPLINE_LABELS = { pilates: "Pilates", pt: "Personal Training", both: "Pilates ve Personal Training" } as const;

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const page = await getPublicPage((await params).slug);
  if (!page) return {};
  const { trainer } = page;
  const name = trainer.businessName || trainer.fullName;
  // "Kadıköy, İstanbul" → "Kadıköy"; the title stays short enough not to be cut off.
  const place = trainer.city?.split(",")[0].trim();
  const title = `${name}${place ? ` · ${place}` : ""} ${DISCIPLINE_LABELS[trainer.discipline]} Dersleri`;
  const description = (trainer.headline || trainer.bio || `${name} ders paketleri ve online kayıt.`).slice(0, 155);
  const image = profileImageUrl(trainer.coverPath ?? trainer.avatarPath);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/${trainer.slug}` },
    openGraph: { title: name, description, url: `/${trainer.slug}`, images: image ? [image] : undefined, type: "profile", siteName: APP_NAME, locale: "tr_TR" },
  };
}

export default async function TrainerPublicPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const page = await getPublicPage(slug);
  if (!page) notFound();

  const { trainer, packages, groups } = page;
  const displayName = trainer.businessName || trainer.fullName;
  const cover = profileImageUrl(trainer.coverPath);
  const avatar = profileImageUrl(trainer.avatarPath);
  const wa = whatsappLink(trainer.phone, `Merhaba, ${displayName} sayfanızdan yazıyorum.`);
  // The best discount on the page gets a ring, so the eye lands on a real deal (no invented "popular" label).
  const best = packages.reduce<{ id: string; pct: number } | null>((acc, p) => {
    const pct = discountPercent(p.compareAtPrice, p.price);
    return pct !== null && (!acc || pct > acc.pct) ? { id: p.id, pct } : acc;
  }, null);

  return (
    <div className="min-h-dvh bg-canvas">
      <main className="mx-auto max-w-2xl px-4 pt-4 pb-12 sm:pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsActivityLocation",
            name: displayName,
            description: trainer.headline ?? trainer.bio ?? undefined,
            url: `${siteUrl()}/${trainer.slug}`,
            image: profileImageUrl(trainer.coverPath ?? trainer.avatarPath) ?? undefined,
            address: trainer.city ? { "@type": "PostalAddress", addressLocality: trainer.city, addressCountry: "TR" } : undefined,
            sameAs: trainer.instagram ? [`https://instagram.com/${trainer.instagram.replace(/^@/, "")}`] : undefined,
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Ders paketleri",
              itemListElement: packages
                .filter((p) => p.price)
                .map((p) => ({ "@type": "Offer", name: p.name, price: Number(p.price).toFixed(2), priceCurrency: "TRY" })),
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
        <header className="overflow-hidden surface">
          <div className="relative aspect-[16/7] w-full overflow-hidden bg-[#1d1d1f] sm:aspect-[8/3]">
            {cover ? (
              <Image src={cover} alt="" fill priority sizes="(max-width: 672px) 100vw, 672px" className="object-cover" />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_0%,rgb(198_242_78/0.55),transparent_55%),radial-gradient(90%_80%_at_0%_100%,rgb(255_255_255/0.08),transparent_60%)]"
              />
            )}
          </div>

          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-12 flex items-end justify-between gap-3 sm:-mt-14">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-muted ring-4 ring-card sm:size-28">
                {avatar ? (
                  <Image src={avatar} alt={displayName} fill sizes="112px" className="object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center bg-lime text-3xl font-semibold text-lime-foreground">
                    {displayName.charAt(0).toLocaleUpperCase("tr")}
                  </span>
                )}
              </div>
            </div>

            <h1 className="mt-4 text-3xl font-semibold text-balance">{displayName}</h1>
            {trainer.businessName && trainer.fullName && (
              <p className="mt-1 text-sm font-medium text-muted-foreground">{trainer.fullName}</p>
            )}
            {trainer.headline && <p className="mt-3 text-base text-pretty">{trainer.headline}</p>}

            {(trainer.city || trainer.instagram) && (
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {trainer.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden />
                    {trainer.city}
                  </span>
                )}
                {trainer.instagram && (
                  <a
                    href={`https://instagram.com/${trainer.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 hover:text-foreground sm:min-h-0"
                  >
                    <AtSign className="size-4" aria-hidden />
                    {trainer.instagram}
                  </a>
                )}
              </div>
            )}

            {trainer.specialties.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Uzmanlık alanları">
                {trainer.specialties.map((s) => (
                  <li key={s} className="rounded-full border bg-muted/60 px-3 py-1.5 text-xs font-medium">
                    {s}
                  </li>
                ))}
              </ul>
            )}

            {trainer.bio && <p className="mt-5 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{trainer.bio}</p>}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {packages.length > 0 && (
                <Button asChild size="lg" className="sm:flex-1">
                  <Link href={`/${slug}/kayit`}>
                    Kayıt ol
                    <ArrowRight />
                  </Link>
                </Button>
              )}
              {wa && (
                <Button asChild size="lg" variant="outline" className="sm:flex-1">
                  <a href={wa} target="_blank" rel="noopener noreferrer">
                    <MessageCircle />
                    WhatsApp&apos;tan yaz
                  </a>
                </Button>
              )}
            </div>
          </div>
        </header>

        <section aria-labelledby="packages-heading" className="mt-10">
          <div className="mb-4 px-1">
            <p className="eyebrow">Ders paketleri</p>
            <h2 id="packages-heading" className="text-2xl font-semibold">
              Sana uygun paketi seç
            </h2>
          </div>
          {packages.length === 0 ? (
            <p className="rounded-2xl border border-dashed bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
              Paketler yakında burada olacak.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {packages.map((p) => (
                <li key={p.id}>
                  <PackageCard slug={slug} pkg={p} highlight={packages.length > 1 && best?.id === p.id} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {groups.length > 0 && (
          <section aria-labelledby="groups-heading" className="mt-10">
            <div className="mb-4 px-1">
              <p className="eyebrow">Her hafta</p>
              <h2 id="groups-heading" className="text-2xl font-semibold">
                Grup ders programı
              </h2>
            </div>
            <ul className="divide-y overflow-hidden surface">
              {groups.map((g) => (
                <li key={g.id} className="flex items-center gap-4 px-4 py-4 sm:px-5">
                  <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-muted py-2">
                    <span className="text-base font-semibold tabular-nums">{g.startTime.slice(0, 5)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{g.durationMinutes} dk</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{g.title}</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1" aria-label={`Günler: ${weekdayList(g.weekdays)}`}>
                      {WEEKDAY_LABELS.map((label, i) => {
                        const on = g.weekdays.includes(i + 1);
                        return (
                          <li
                            key={label}
                            aria-hidden
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              on ? "bg-lime text-lime-foreground" : "text-muted-foreground",
                            )}
                          >
                            {label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1 text-sm text-muted-foreground tabular-nums sm:inline-flex">
                    <UsersRound className="size-4" aria-hidden />
                    {g.capacity} kişi
                  </span>
                  <span className="sr-only sm:hidden">{g.capacity} kişilik</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-12 flex justify-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <span className="flex size-5 items-center justify-center rounded-md bg-lime text-lime-foreground" aria-hidden>
              <Activity className="size-3" />
            </span>
            {APP_NAME} ile oluşturuldu
          </Link>
        </footer>
      </main>
    </div>
  );
}

function PackageCard({ slug, pkg: p, highlight }: { slug: string; pkg: PublicPage["packages"][number]; highlight: boolean }) {
  const plan = paymentOptions(p).find((o) => o.installments > 1);
  const perLesson = p.price && p.sessionCount > 1 ? Number(p.price) / p.sessionCount : null;
  return (
    <article className={cn("flex flex-col gap-5 surface p-5 sm:p-6", highlight && "ring-2 ring-lime")}>
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold">{p.name}</h3>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{SESSION_TYPE_LABELS[p.sessionType]}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden />
            {p.sessionCount} ders
          </span>
          {p.validityDays ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {p.validityDays} gün geçerli
            </span>
          ) : null}
        </p>
      </div>

      {(p.price || plan) && (
        <div className="flex flex-col gap-1 rounded-xl bg-muted/60 px-4 py-3">
          {p.price ? (
            <>
              <PriceTag price={p.price} compareAtPrice={p.compareAtPrice} size="lg" align="start" className="[&>span:first-child]:text-2xl" />
              {perLesson && <p className="text-xs text-muted-foreground tabular-nums">Peşin · ders başı {formatTRY(perLesson)}</p>}
            </>
          ) : (
            plan && <p className="text-2xl font-semibold tabular-nums">{formatTRY(plan.total)}</p>
          )}
          {plan && (
            <p className="text-xs text-muted-foreground tabular-nums">
              ya da {plan.installments} × {formatTRY(monthlyAmount(plan))} taksit
            </p>
          )}
        </div>
      )}

      {p.description && <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>}
      {p.features.length > 0 && (
        <ul className="flex flex-col gap-2.5 text-sm">
          {p.features.map((f) => (
            <li key={f} className="flex gap-2.5">
              <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground" aria-hidden>
                <Check className="size-3" strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>
      )}
      <Button asChild size="lg" className="w-full">
        <Link href={`/${slug}/kayit?paket=${p.id}`}>
          Bu paketi seç
          <ArrowRight />
        </Link>
      </Button>
    </article>
  );
}
