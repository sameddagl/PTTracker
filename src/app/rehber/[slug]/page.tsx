import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Analytics } from "@/components/analytics";
import { RichText } from "@/components/landing/rich-text";
import { Breadcrumbs, CtaBand, JsonLd, SiteFooter, SiteHeader, card } from "@/components/landing/site-chrome";
import { APP_NAME, siteUrl } from "@/lib/config";
import { GUIDES, guideBySlug, guideDate, type GuideBlock } from "@/lib/guides";
import { cn } from "@/lib/utils";

export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: PageProps<"/rehber/[slug]">): Promise<Metadata> {
  const g = guideBySlug((await params).slug);
  if (!g) return {};
  const path = `/rehber/${g.slug}`;
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: path },
    openGraph: {
      title: `${g.title} · ${APP_NAME}`,
      description: g.description,
      url: path,
      type: "article",
      locale: "tr_TR",
      publishedTime: g.published,
      modifiedTime: g.updated,
    },
  };
}

function Block({ b }: { b: GuideBlock }) {
  switch (b.t) {
    case "h2":
      return <h2 className="mt-6 text-2xl leading-tight font-semibold tracking-[-0.025em]">{b.text}</h2>;
    case "p":
      return (
        <p className="text-base leading-relaxed text-muted-foreground">
          <RichText text={b.text} />
        </p>
      );
    case "ul":
    case "ol": {
      const List = b.t;
      return (
        <List className={cn("flex flex-col gap-2 pl-5 text-base leading-relaxed text-muted-foreground", b.t === "ul" ? "list-disc" : "list-decimal")}>
          {b.items.map((it) => (
            <li key={it} className="pl-1">
              <RichText text={it} />
            </li>
          ))}
        </List>
      );
    }
    case "example":
      return (
        <figure className={cn(card, "flex flex-col gap-2 p-5 sm:p-6")}>
          <figcaption className="eyebrow">{b.title}</figcaption>
          <p className="text-base leading-relaxed whitespace-pre-line">{b.text}</p>
        </figure>
      );
    case "note":
      return <p className="rounded-2xl bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">{b.text}</p>;
  }
}

export default async function GuidePage({ params }: PageProps<"/rehber/[slug]">) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const site = siteUrl();
  const url = `${site}/rehber/${g.slug}`;
  const others = GUIDES.filter((o) => o.slug !== g.slug);

  return (
    <div data-marketing className="min-h-dvh overflow-x-clip bg-canvas">
      <Analytics />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              "@id": `${url}#article`,
              headline: g.title,
              description: g.description,
              url,
              mainEntityOfPage: url,
              inLanguage: "tr-TR",
              datePublished: g.published,
              dateModified: g.updated,
              author: { "@type": "Organization", name: APP_NAME, url: site },
              publisher: { "@type": "Organization", name: APP_NAME, url: site },
              isPartOf: { "@id": `${site}/#website` },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Ana sayfa", item: site },
                { "@type": "ListItem", position: 2, name: "Rehber", item: `${site}/rehber` },
                { "@type": "ListItem", position: 3, name: g.title, item: url },
              ],
            },
          ],
        }}
      />
      <SiteHeader page="rehber" />
      <Breadcrumbs
        items={[
          { href: "/rehber", label: "Rehber" },
          { href: `/rehber/${g.slug}`, label: g.title },
        ]}
      />

      <main className="px-4 pt-8 pb-20 sm:px-6 sm:pt-14">
        <article className="mx-auto max-w-2xl">
          <header>
            <h1 className="text-[2rem] leading-[1.1] font-semibold tracking-[-0.035em] text-balance sm:text-[2.75rem]">{g.title}</h1>
            <p className="mt-4 flex flex-wrap gap-x-2 text-sm text-muted-foreground">
              <span>{g.minutes} dk okuma</span>
              <span aria-hidden>·</span>
              <span>
                Güncellendi: <time dateTime={g.updated}>{guideDate(g.updated)}</time>
              </span>
            </p>
          </header>
          <div className="mt-8 flex flex-col gap-5">
            {g.body.map((b, i) => (
              <Block key={i} b={b} />
            ))}
          </div>

          <Link href={g.related.href} className={cn(card, "hover-lift group mt-12 flex items-center gap-3 p-5")}>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">{APP_NAME}</span>
              <span className="block font-semibold">{g.related.label}</span>
            </span>
            <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </article>

        <nav aria-labelledby="others-heading" className="mx-auto mt-16 max-w-2xl">
          <h2 id="others-heading" className="mb-4 text-lg font-semibold">
            Diğer yazılar
          </h2>
          <ul className="divide-y overflow-hidden surface">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/rehber/${o.slug}`} className="flex min-h-12 items-center gap-3 px-5 py-3 text-sm font-medium hover:bg-muted/50">
                  <span className="min-w-0 flex-1">{o.title}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>

      <CtaBand page="rehber" title="Paketleri, yoklamayı ve ödemeleri tek yerde tutun." text="Beta süresince ücretsiz, kart bilgisi istemiyoruz." />
      <SiteFooter />
    </div>
  );
}
