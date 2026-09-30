import Link from "next/link";
import { Activity, ArrowRight, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME, siteUrl } from "@/lib/config";
import { LEGAL } from "@/lib/legal";
import { cn } from "@/lib/utils";

// Shared frame for the marketing pages (landing, audience pages, pricing):
// header, footer, section headings, FAQ list and the closing call to action.

/** Rounded white card on the canvas; one radius for every card on these pages. */
export const card = "rounded-[1.75rem] border bg-card shadow-card";

export type NavLink = { href: string; label: string };

/** Marketing pages linked from every footer (and the header on inner pages). */
export const MARKETING_PAGES: NavLink[] = [
  { href: "/pilates-egitmenleri", label: "Pilates eğitmenleri" },
  { href: "/personal-trainer", label: "Personal trainer" },
  { href: "/fiyatlar", label: "Fiyatlar" },
];

export function Logo() {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-full text-[1.0625rem] font-semibold tracking-[-0.02em]">
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-lime text-lime-foreground">
        <Activity className="size-[18px]" strokeWidth={2.5} aria-hidden />
      </span>
      {APP_NAME}
    </Link>
  );
}

export function SiteHeader({ nav = MARKETING_PAGES, page = "landing" }: { nav?: NavLink[]; page?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-canvas/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Sayfa" className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex min-h-11 items-center rounded-full px-3 transition-colors hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" className="max-sm:hidden">
            <Link href="/giris" data-umami-event={`${page}-giris`}>
              Giriş yap
            </Link>
          </Button>
          <Button asChild>
            <Link href="/giris" data-umami-event={`${page}-basla`} data-umami-event-yer="ust-menu">
              Ücretsiz başlayın
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex flex-col gap-1">
          <Logo />
          <p className="text-sm text-muted-foreground">Pilates ve PT eğitmenleri için danışan, seans ve ödeme takibi.</p>
          <p className="text-sm text-muted-foreground">
            {LEGAL.controller} ·{" "}
            <a href={`mailto:${LEGAL.email}`} className="underline-offset-2 hover:text-foreground hover:underline">
              {LEGAL.email}
            </a>
          </p>
        </div>
        <nav aria-label="Alt bilgi" className="grid grid-cols-2 gap-x-8 text-sm text-muted-foreground sm:flex sm:gap-x-10">
          <ul>
            {MARKETING_PAGES.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-11 items-center whitespace-nowrap hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul>
            {[
              { href: "/kvkk", label: "KVKK Aydınlatma Metni" },
              { href: "/kosullar", label: "Kullanım Koşulları" },
              { href: "/giris", label: "Giriş yap" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-11 items-center whitespace-nowrap hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  lead,
  rest,
  className,
}: {
  id: string;
  eyebrow: string;
  lead: string;
  rest?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-4xl text-center", className)}>
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h2 id={id} className="text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-5xl sm:leading-[1.05]">
        <span className="text-foreground">{lead}</span>
        {rest && <span className="text-muted-foreground"> {rest}</span>}
      </h2>
    </div>
  );
}

export function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Kapsam">
      {items.map((c) => (
        <li key={c} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {c}
        </li>
      ))}
    </ul>
  );
}

export type Faq = { q: string; a: string };

export function FaqSection({ items, id = "sss" }: { items: Faq[]; id?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-20 px-4 pt-24 sm:px-6 sm:pt-32">
      <SectionHeading id={`${id}-heading`} eyebrow="SSS" lead="Sık sorulan sorular" />
      <div className={cn(card, "mx-auto mt-12 max-w-3xl divide-y")}>
        {items.map(({ q, a }) => (
          <details key={q} className="group px-5 sm:px-7 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-medium outline-none focus-visible:underline">
              {q}
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary transition-transform group-open:rotate-45"
              >
                <Plus className="size-4" />
              </span>
            </summary>
            <p className="-mt-1 max-w-2xl pb-6 text-sm leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function CtaBand({ title, text, page }: { title: string; text: string; page: string }) {
  return (
    <section aria-labelledby="cta-heading" className="px-4 pt-24 pb-16 sm:px-6 sm:pt-32 sm:pb-24">
      <div className="relative mx-auto flex max-w-6xl flex-col items-center overflow-hidden rounded-[1.75rem] bg-lime px-6 py-16 text-center text-lime-foreground sm:py-20">
        <span aria-hidden className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-lime-foreground text-lime">
          <Activity className="size-6" strokeWidth={2.5} />
        </span>
        <h2 id="cta-heading" className="max-w-2xl text-[2rem] leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
          {title}
        </h2>
        <p className="mt-4 max-w-md text-base">{text}</p>
        <Link
          href="/giris"
          data-umami-event={`${page}-basla`}
          data-umami-event-yer="alt"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-lime-foreground px-7 text-base font-medium text-lime transition-opacity outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-lime-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-lime"
        >
          Ücretsiz başlayın
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: NavLink[] }) {
  return (
    <nav aria-label="Konum" className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="inline-flex min-h-11 items-center hover:text-foreground">
            Ana sayfa
          </Link>
        </li>
        {items.map((it, i) => (
          <li key={it.href} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" aria-hidden />
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-foreground">
                {it.label}
              </span>
            ) : (
              <Link href={it.href} className="inline-flex min-h-11 items-center hover:text-foreground">
                {it.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** JSON-LD for an inner marketing page: the page (linked to the site graph on the landing), breadcrumbs and FAQ. */
export function pageJsonLd({ path, title, description, crumbs, faq }: { path: string; title: string; description: string; crumbs: NavLink[]; faq: Faq[] }) {
  const site = siteUrl();
  const url = `${site}${path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: "tr-TR",
        isPartOf: { "@id": `${site}/#website` },
        about: { "@id": `${site}/#software` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [{ href: "/", label: "Ana sayfa" }, ...crumbs].map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.label,
          item: `${site}${c.href === "/" ? "" : c.href}`,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      },
    ],
  };
}

export function JsonLd({ data }: { data: unknown }) {
  // Escaping "<" keeps the JSON from closing the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
