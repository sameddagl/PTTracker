import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Analytics } from "@/components/analytics";
import { Breadcrumbs, CtaBand, JsonLd, SiteFooter, SiteHeader, card } from "@/components/landing/site-chrome";
import { APP_NAME, siteUrl } from "@/lib/config";
import { GUIDES, guideDate } from "@/lib/guides";
import { cn } from "@/lib/utils";

const PATH = "/rehber";
const TITLE = "Rehber: Pilates Eğitmenleri ve PT'ler İçin Pratik Yazılar";
const DESCRIPTION =
  "Bağımsız çalışan pilates eğitmenleri ve personal trainer'lar için seans paketi takibi, ders fiyatı, iptal politikası ve hatırlatma mesajları üzerine pratik yazılar.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} · ${APP_NAME}`, description: DESCRIPTION, url: PATH, type: "website", locale: "tr_TR" },
};

export default function GuidesPage() {
  const site = siteUrl();
  return (
    <div data-marketing className="min-h-dvh overflow-x-clip bg-canvas">
      <Analytics />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${site}${PATH}#webpage`,
          url: `${site}${PATH}`,
          name: TITLE,
          description: DESCRIPTION,
          inLanguage: "tr-TR",
          isPartOf: { "@id": `${site}/#website` },
          hasPart: GUIDES.map((g) => ({ "@type": "Article", headline: g.title, url: `${site}${PATH}/${g.slug}` })),
        }}
      />
      <SiteHeader page="rehber" />
      <Breadcrumbs items={[{ href: PATH, label: "Rehber" }]} />

      <main className="px-4 pt-8 pb-20 sm:px-6 sm:pt-14">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow mb-4">Rehber</p>
          <h1 className="text-[2.25rem] leading-[1.06] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
            Tek başına ders verenler için pratik yazılar
          </h1>
          <p className="mt-5 text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            Seans paketi, fiyat, iptal kuralı, hatırlatma mesajı… Pilates eğitmenlerinin ve PT&apos;lerin her gün karşılaştığı
            konular, örnek metinlerle.
          </p>

          <ul className="mt-12 flex flex-col gap-4">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link href={`${PATH}/${g.slug}`} className={cn(card, "hover-lift group flex flex-col gap-2 p-6 sm:p-7")}>
                  <h2 className="text-xl leading-snug font-semibold tracking-[-0.02em]">{g.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{g.description}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{g.minutes} dk okuma</span>
                    <span aria-hidden>·</span>
                    <time dateTime={g.updated}>{guideDate(g.updated)}</time>
                    <ArrowRight className="ml-auto size-4 text-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <CtaBand page="rehber" title="Paketleri, yoklamayı ve ödemeleri tek yerde tutun." text="Beta süresince ücretsiz, kart bilgisi istemiyoruz." />
      <SiteFooter />
    </div>
  );
}
