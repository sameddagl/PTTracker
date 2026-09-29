import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AtSign, Check, MapPin, MessageCircle, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/price-tag";
import { weekdayList } from "@/lib/dates";
import { SESSION_TYPE_LABELS, formatTRY } from "@/lib/format";
import { monthlyAmount, paymentOptions } from "@/lib/pricing";
import { getPublicPage, type PublicPage } from "@/lib/public-page";
import { profileImageUrl } from "@/lib/storage";
import { whatsappLink } from "@/lib/whatsapp";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const page = await getPublicPage((await params).slug);
  if (!page) return {};
  const { trainer } = page;
  const title = trainer.businessName || trainer.fullName;
  const image = profileImageUrl(trainer.coverPath ?? trainer.avatarPath);
  return {
    title: { absolute: title },
    description: trainer.headline ?? `${title} ders paketleri`,
    openGraph: { title, description: trainer.headline ?? undefined, images: image ? [image] : undefined, type: "profile" },
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

  return (
    <main className="mx-auto min-h-dvh max-w-2xl pb-16">
      <header>
        <div className="relative aspect-[8/3] w-full overflow-hidden bg-gradient-to-br from-primary/40 via-primary/15 to-muted sm:rounded-b-2xl">
          {cover && <Image src={cover} alt="" fill priority sizes="(max-width: 672px) 100vw, 672px" className="object-cover" />}
        </div>
        <div className="px-4">
          <div className="-mt-12 flex items-end justify-between gap-3">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-4 border-background bg-muted">
              {avatar ? (
                <Image src={avatar} alt={displayName} fill sizes="96px" className="object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                  {displayName.charAt(0).toLocaleUpperCase("tr")}
                </span>
              )}
            </div>
            {wa && (
              <Button asChild variant="outline" size="sm" className="mb-1">
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle />
                  Mesaj gönder
                </a>
              </Button>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{displayName}</h1>
          {trainer.businessName && trainer.fullName && (
            <p className="text-sm text-muted-foreground">{trainer.fullName}</p>
          )}
          {trainer.headline && <p className="mt-2 text-pretty">{trainer.headline}</p>}

          {(trainer.city || trainer.instagram) && (
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {trainer.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden />
                  {trainer.city}
                </span>
              )}
              {trainer.instagram && (
                <a
                  href={`https://instagram.com/${trainer.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <AtSign className="size-3.5" aria-hidden />
                  {trainer.instagram}
                </a>
              )}
            </p>
          )}

          {trainer.specialties.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Uzmanlık alanları">
              {trainer.specialties.map((s) => (
                <li key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {s}
                </li>
              ))}
            </ul>
          )}

          {trainer.bio && <p className="mt-5 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{trainer.bio}</p>}
        </div>
      </header>

      <section aria-labelledby="packages-heading" className="mt-10 px-4">
        <h2 id="packages-heading" className="mb-4 text-xl font-semibold">
          Paketler
        </h2>
        {packages.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Paketler yakında burada olacak.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {packages.map((p) => (
              <li key={p.id}>
                <PackageCard slug={slug} pkg={p} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {groups.length > 0 && (
        <section aria-labelledby="groups-heading" className="mt-10 px-4">
          <h2 id="groups-heading" className="mb-4 text-xl font-semibold">
            Grup ders programı
          </h2>
          <ul className="divide-y rounded-2xl border bg-card">
            {groups.map((g) => (
              <li key={g.id} className="flex items-center gap-4 px-5 py-4">
                <UsersRound className="size-5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{g.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {weekdayList(g.weekdays)} · {g.startTime} · {g.durationMinutes} dk
                  </p>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{g.capacity} kişi</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-12 px-4 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          PTTracker ile oluşturuldu
        </Link>
      </footer>
    </main>
  );
}

function PackageCard({ slug, pkg: p }: { slug: string; pkg: PublicPage["packages"][number] }) {
  const plan = paymentOptions(p).find((o) => o.installments > 1);
  const perLesson = p.price && p.sessionCount > 1 ? Number(p.price) / p.sessionCount : null;
  return (
    <article className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold">{p.name}</h3>
          <p className="text-sm text-muted-foreground">
            {SESSION_TYPE_LABELS[p.sessionType]} · {p.sessionCount} ders
            {p.validityDays ? ` · ${p.validityDays} gün geçerli` : ""}
          </p>
        </div>
        {(p.price || plan) && (
          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            {p.price ? (
              <>
                <PriceTag price={p.price} compareAtPrice={p.compareAtPrice} size="lg" className="max-w-40" />
                {perLesson && <p className="text-xs text-muted-foreground tabular-nums">peşin · ders başı {formatTRY(perLesson)}</p>}
              </>
            ) : (
              plan && <p className="text-xl font-semibold tabular-nums">{formatTRY(plan.total)}</p>
            )}
            {plan && (
              <p className="text-xs text-muted-foreground tabular-nums">
                ya da {plan.installments} × {formatTRY(monthlyAmount(plan))} taksit
              </p>
            )}
          </div>
        )}
      </div>
      {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
      {p.features.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm">
          {p.features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      )}
      <Button asChild size="lg">
        <Link href={`/${slug}/kayit?paket=${p.id}`}>Bu paketi seç</Link>
      </Button>
    </article>
  );
}
