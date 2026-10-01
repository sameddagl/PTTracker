import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Download, Percent, ShieldCheck } from "lucide-react";
import { Analytics } from "@/components/analytics";
import { Reveal } from "@/components/landing/reveal";
import { stagger } from "@/lib/motion";
import { Breadcrumbs, CtaBand, FaqSection, JsonLd, SiteFooter, SiteHeader, card, pageJsonLd, type Faq } from "@/components/landing/site-chrome";
import { Button } from "@/components/ui/button";
import { APP_NAME, siteUrl } from "@/lib/config";
import { cn } from "@/lib/utils";

const PATH = "/fiyatlar";
const TITLE = "Fiyatlar: Beta Süresince Ücretsiz";
const DESCRIPTION = `${APP_NAME} beta süresince pilates eğitmenleri ve personal trainer'lar için ücretsiz. Kart bilgisi yok, komisyon yok. Ücretli plana geçmeden en az bir hafta önce haber veririz.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${APP_NAME} ${TITLE}`, description: DESCRIPTION, url: PATH, type: "website", locale: "tr_TR" },
};

const INCLUDED = [
  "Sınırsız danışan ve seans paketi",
  "Yoklama, telafi hakkı ve geç iptal kuralı",
  "Grup dersleri, kontenjan ve sabit yer",
  "Danışanın kendi aldığı randevular",
  "Instagram'a koyacağınız sayfa ve kayıt formu",
  "Antrenman programı, beslenme planı ve hareket listesi",
  "Ölçüm takibi ve gelişim grafikleri, ders notları",
  "Ders, taksit ve ölçüm hatırlatması, mesajlaşma",
  "Taksit, havale bildirimi ve dekont onayı",
  "Excel'den aktarma ve Excel olarak indirme",
];

const PROMISES = [
  {
    icon: ShieldCheck,
    title: "Bir hafta önceden haber",
    text: "Ücretli plana geçmeden en az bir hafta önce e-postayla haber veririz. Devam edip etmemek size kalır.",
  },
  {
    icon: Percent,
    title: "Beta kullanıcılarına ilk abonelikte indirim",
    text: "Beta sırasında başlayan eğitmenler ücretli plana geçerken ilk aboneliklerini indirimli alır.",
  },
  {
    icon: Download,
    title: "Verileriniz sizin",
    text: "Danışanlarınızı, paketleri, dersleri ve ödemeleri istediğiniz an Excel olarak indirirsiniz. Hesabınızı silerseniz her şey kalıcı olarak silinir.",
  },
];

const FAQ: Faq[] = [
  {
    q: "Beta ne zaman bitecek?",
    a: "Kesin bir tarih yok. Ücretli plana geçmeden en az bir hafta önce haber veririz; o zamana kadar bütün özellikler ücretsiz.",
  },
  {
    q: "Danışan sayısında sınır var mı?",
    a: "Beta süresince yok. İstediğiniz kadar danışan, paket ve ders ekleyebilirsiniz.",
  },
  {
    q: "Ödemelerden komisyon alıyor musunuz?",
    a: `Hayır. Danışan parayı doğrudan sizin IBAN'ınıza gönderir; ${APP_NAME} araya girmez, komisyon almaz.`,
  },
  {
    q: "Danışanlarım bir şey ödüyor mu?",
    a: `Hayır. Danışanlar ${APP_NAME}'a hiçbir şey ödemez; sadece size paket ücretini öder.`,
  },
  {
    q: "Ücretli plana geçmek istemezsem ne olur?",
    a: "Verilerinizi Excel olarak indirip hesabınızı silebilirsiniz. Hesap silindiğinde danışan kayıtlarınız da kalıcı olarak silinir.",
  },
  {
    q: "Kart bilgisi istiyor musunuz?",
    a: "Hayır. Kayıt için e-posta adresiniz yeterli; giriş kodu e-postanıza gelir.",
  },
];

export default function PricingPage() {
  const ld = pageJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, crumbs: [{ href: PATH, label: "Fiyatlar" }], faq: FAQ });
  ld["@graph"].push({
    "@type": "Offer",
    "@id": `${siteUrl()}${PATH}#beta`,
    name: "Beta",
    price: "0",
    priceCurrency: "TRY",
    availability: "https://schema.org/InStock",
    url: `${siteUrl()}/giris`,
    description: "Beta süresince bütün özellikler ücretsiz.",
    itemOffered: { "@id": `${siteUrl()}/#software` },
  } as never);

  return (
    <div data-marketing className="min-h-dvh overflow-x-clip bg-canvas">
      <Analytics />
      <Reveal />
      <JsonLd data={ld} />
      <SiteHeader page="fiyat" />
      <Breadcrumbs items={[{ href: PATH, label: "Fiyatlar" }]} />

      <main>
        <section aria-labelledby="hero-heading" className="px-4 pt-8 text-center sm:px-6 sm:pt-14">
          <p className="anim-rise eyebrow mb-4">Fiyatlar</p>
          <h1 id="hero-heading" style={{ "--delay": "80ms" } as React.CSSProperties} className="anim-rise mx-auto max-w-3xl text-[2.25rem] leading-[1.06] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
            {APP_NAME} beta süresince ücretsiz
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            Kart bilgisi istemiyoruz, ödemelerden komisyon almıyoruz. Bütün özellikler açık.
          </p>
        </section>

        <section aria-labelledby="plan-heading" className="px-4 pt-12 sm:px-6">
          <div style={{ "--delay": "160ms" } as React.CSSProperties} className={cn(card, "anim-rise mx-auto flex max-w-xl flex-col gap-6 p-6 ring-2 ring-lime sm:p-8")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="plan-heading" className="text-xl font-semibold tracking-[-0.02em]">
                  Beta
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Tek başına çalışan pilates eğitmenleri ve personal trainer&apos;lar için</p>
              </div>
              <p className="shrink-0 text-right">
                <span className="block text-4xl font-semibold tracking-[-0.04em] tabular-nums">₺0</span>
                <span className="text-xs text-muted-foreground">beta boyunca</span>
              </p>
            </div>
            <ul className="flex flex-col gap-2.5 text-sm">
              {INCLUDED.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground" aria-hidden>
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="w-full">
              <Link href="/giris" data-umami-event="fiyat-basla" data-umami-event-yer="plan">
                Ücretsiz başlayın
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="promise-heading" className="px-4 pt-20 sm:px-6 sm:pt-28">
          <h2 id="promise-heading" className="mx-auto max-w-3xl text-center text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
            Beta bitince ne olacak?
          </h2>
          <ul className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
            {PROMISES.map(({ icon: Icon, title, text }, i) => (
              <li key={title} data-reveal style={stagger(i)} className={cn(card, "hover-lift flex flex-col gap-3 p-6")}>
                <span className="flex size-10 items-center justify-center rounded-full bg-lime text-lime-foreground" aria-hidden>
                  <Icon className="size-5" />
                </span>
                <h3 className="text-lg font-semibold tracking-[-0.02em]">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <FaqSection items={FAQ} />

        <CtaBand page="fiyat" title="Ücretsiz başlayın, beta boyunca hiçbir şey ödemeyin." text="Kayıt için e-posta adresiniz yeterli." />
      </main>
      <SiteFooter />
    </div>
  );
}
