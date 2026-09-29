import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, AlertTriangle } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { LEGAL } from "@/lib/legal";

const LINKS = [
  { href: "/kvkk", label: "Aydınlatma Metni" },
  { href: "/acik-riza", label: "Açık Rıza Metni" },
  { href: "/kosullar", label: "Kullanım Koşulları" },
];

/** Shared frame for the legal texts: logo, title, draft notice, readable article, links between the texts. */
export function LegalPage({ eyebrow, title, current, children }: { eyebrow: string; title: string; current: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-xl bg-lime text-lime-foreground" aria-hidden>
            <Activity className="size-4" />
          </span>
          {APP_NAME}
        </Link>
        <nav aria-label="Hukuki metinler" className="mt-4 flex flex-wrap gap-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.href === current ? "page" : undefined}
              className={
                l.href === current
                  ? "inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
                  : "inline-flex min-h-10 items-center rounded-full bg-card px-4 text-sm font-medium ring-1 ring-border hover:bg-muted"
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <article className="mt-6 surface p-6 sm:p-10">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-1 text-3xl font-semibold text-balance">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Son güncelleme: {LEGAL.updatedOn}</p>
          {!LEGAL.READY && (
            <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning-strong">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              Taslak metindir. Beta yayına çıkmadan önce hukuki olarak gözden geçirilecektir.
            </p>
          )}
          <div className="mt-8 max-w-prose text-base leading-relaxed text-pretty text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2">{children}</div>
        </article>
      </main>
    </div>
  );
}

/** A numbered section with an anchor. */
export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-6 first:mt-0">
      <h2 className="mb-3 text-xl font-semibold text-foreground">{title}</h2>
      <div className="flex flex-col gap-3 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
        {children}
      </div>
    </section>
  );
}

/** Controller identity and contact, as KVKK requires in every notice. */
export function ControllerCard() {
  return (
    <dl className="grid gap-x-6 gap-y-2 rounded-2xl bg-muted p-4 text-sm sm:grid-cols-[auto_1fr]">
      <dt className="text-muted-foreground">Veri sorumlusu</dt>
      <dd className="font-medium text-foreground">{LEGAL.controller}</dd>
      <dt className="text-muted-foreground">Adres</dt>
      <dd className="text-foreground">{LEGAL.address}</dd>
      <dt className="text-muted-foreground">E-posta</dt>
      <dd className="text-foreground">{LEGAL.email}</dd>
    </dl>
  );
}
