import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowRight, Check, Plus, UserPlus, FileText } from "lucide-react";
import {
  AttendanceDemo,
  BookingDemo,
  GroupDemo,
  PaymentDemo,
  PricingDemo,
  PublicPageDemo,
} from "@/components/landing/feature-demos";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: `${APP_NAME} · PT ve pilates eğitmenleri için danışan ve paket takibi` },
  description:
    "Derslerini, paketlerini ve ödemelerini tek uygulamadan yönet. Excel ve WhatsApp karmaşasına son. Beta döneminde eğitmenler için ücretsiz.",
  openGraph: {
    title: `${APP_NAME} · Danışan, paket ve ödeme takibi`,
    description:
      "PT ve pilates eğitmenleri için. Danışanların uygulama indirmez; kendi linkinden kayıt olur, randevu alır, ödemesini bildirir.",
    type: "website",
  },
};

const FEATURES = [
  {
    title: "Tek dokunuşla yoklama, paket kendiliğinden düşer",
    text: "Geldi, gelmedi, geç iptal. Kalan ders anında güncellenir; telafi hakkı varsa ders yanmaz.",
    chips: ["Yoklama", "Telafi hakkı", "24 saat kuralı", "Paket bakiyesi"],
    Demo: AttendanceDemo,
  },
  {
    title: "Instagram'a özel sayfan ve online kayıt",
    text: "Paketlerin ve tanıtımın tek linkte. Bio'na koy; danışan paketi seçip formu doldursun, sen onayla.",
    chips: ["Kişisel sayfa", "Kayıt formu", "Başvuru onayı", "KVKK rızası"],
    Demo: PublicPageDemo,
  },
  {
    title: "Paketler, indirim, peşin ya da taksit",
    text: "Özel, düet ya da grup paketleri. İndirimli fiyat, taksit planı ve dondurma hakkı paketin içinde.",
    chips: ["Paketler", "İndirim", "Taksit", "Dondurma"],
    Demo: PricingDemo,
  },
  {
    title: "Grup dersleri, dolu kontenjan derdi yok",
    text: "Kapasiteyi belirle, sabit danışanlarına yerlerini ayır, kalan yerlere tek tek katılım al.",
    chips: ["Kapasite", "Sabit yer", "Tek tek katılım"],
    Demo: GroupDemo,
  },
  {
    title: "Danışan kendi randevusunu alır",
    text: "Çalışma saatlerini gir; danışan boş saatlerden seçer. Çakışma olmaz, iptal kuralın işler.",
    chips: ["Online randevu", "Müsaitlik", "İptal kuralı"],
    Demo: BookingDemo,
  },
  {
    title: "Havale bildirimi, dekont ve WhatsApp hatırlatma",
    text: "Danışan IBAN'ına öder, dekontunu yükler; sen onaylarsın. Paketi bitmek üzere olana hazır mesajla hatırlat.",
    chips: ["IBAN", "Dekont", "WhatsApp", "Hatırlatma"],
    Demo: PaymentDemo,
  },
];

const STATS = [
  { value: "₺0", label: "Beta boyunca ücretsiz" },
  { value: "0 uygulama", label: "Danışanının indirmesi gereken" },
  { value: "4 hafta", label: "İleriye otomatik planlanan grup dersleri" },
];

const STEPS = [
  { title: "Paketlerini ve sayfanı hazırla", text: "Paketlerini, fiyatlarını, çalışma saatlerini ve kayıt formunu dakikalar içinde oluştur." },
  { title: "Linkini Instagram'da paylaş", text: "Danışanın sayfandan paketini seçer, formu doldurur ve başvurur. Hesap açması gerekmez." },
  { title: "Onayla ve takip et", text: "Başvuruyu onayla; dersler, yoklama, ödemeler ve hatırlatmalar tek ekranda." },
];

const REASONS = [
  {
    title: "Türkiye'ye özel paket motoru",
    text: "Telafi hakkı, 24 saat iptal kuralı, dondurma ve taksit. Buradaki stüdyoların gerçekten çalıştığı gibi.",
  },
  {
    title: "Danışanın için uygulama yok",
    text: "Her danışanın kişisel bir linki olur. Tarayıcıda açılır; şifre yok, indirme yok.",
  },
  {
    title: "Paralar doğrudan senin IBAN'ına",
    text: "Ödemeler bizim üzerimizden geçmez, komisyon yok. Danışan havale yapar, dekontu yükler, sen onaylarsın.",
  },
  {
    title: "Veriler KVKK'ya uygun",
    text: "Sağlık bilgisi yalnızca danışanın açık rızasıyla alınır. Her eğitmen sadece kendi danışanlarını görür.",
  },
];

const FAQ = [
  {
    q: "Danışanlarım bir uygulama indirmek zorunda mı?",
    a: "Hayır. Her danışanın kişisel bir linki olur; WhatsApp'tan ya da e-postayla gönderirsin, tarayıcıda açılır. Şifre ya da hesap gerekmez.",
  },
  {
    q: "Ödemeler uygulamanın üzerinden mi geçiyor?",
    a: "Hayır. Danışan doğrudan senin IBAN'ına havale yapar ve dekontuyla bildirir; sen onaylarsın. Nakit ya da kartla aldığın ödemeleri de kendin girebilirsin.",
  },
  {
    q: "Danışanlarımın sağlık bilgileri güvende mi?",
    a: "Sağlık bilgileri yalnızca danışan açık rıza verirse sorulur ve saklanır. Her eğitmen sadece kendi danışanlarını görebilir; bu kural veritabanı seviyesinde uygulanır.",
  },
  {
    q: "Excel'deki danışan listemi aktarabilir miyim?",
    a: "Excel'den tek seferde aktarma yakında geliyor. O zamana kadar danışanlarını birkaç dokunuşla elle ekleyebilirsin.",
  },
  {
    q: "Ücretli mi?",
    a: "Beta döneminde eğitmenler için tamamen ücretsiz. Kredi kartı istemiyoruz.",
  },
];

const HERO_CHECKS = ["Kredi kartı gerekmez", "Danışanın uygulama indirmez", "Türkçe ve TL"];

const NAV = [
  { href: "#ozellikler", label: "Özellikler" },
  { href: "#nasil-calisir", label: "Nasıl çalışır" },
  { href: "#sss", label: "SSS" },
];

// Rounded white card on the canvas; one radius for every card on the page.
const card = "rounded-[1.75rem] border bg-card shadow-card";

function Logo() {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-full text-[1.0625rem] font-semibold tracking-[-0.02em]">
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-lime text-lime-foreground">
        <Activity className="size-[18px]" strokeWidth={2.5} aria-hidden />
      </span>
      {APP_NAME}
    </Link>
  );
}

function SectionHeading({
  id,
  eyebrow,
  lead,
  rest,
  className,
}: {
  id: string;
  eyebrow: string;
  lead: string;
  rest: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-4xl text-center", className)}>
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h2 id={id} className="text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-5xl sm:leading-[1.05]">
        <span className="text-foreground">{lead}</span> <span className="text-muted-foreground">{rest}</span>
      </h2>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
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

export default function Home() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-canvas">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-canvas/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Sayfa" className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="flex min-h-11 items-center rounded-full px-3 transition-colors hover:text-foreground">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" className="max-sm:hidden">
              <Link href="/giris">Giriş yap</Link>
            </Button>
            <Button asChild>
              <Link href="/giris">Ücretsiz başla</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section aria-labelledby="hero-heading" className="relative px-4 pt-14 sm:px-6 sm:pt-20 lg:pt-24">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <p className="mb-7 inline-flex items-center gap-2 rounded-full border bg-card py-1.5 pr-3.5 pl-2 text-xs font-medium shadow-card sm:text-sm">
              <span className="rounded-full bg-lime px-2 py-0.5 text-lime-foreground">Beta</span>
              Eğitmenler için ücretsiz
            </p>
            <h1
              id="hero-heading"
              className="text-[2.5rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.5rem]"
            >
              <span className="block text-foreground">Derslerin, paketlerin, ödemelerin.</span>
              <span className="block text-muted-foreground">Tek uygulamada, cebinde.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
              PT ve pilates eğitmenleri için ders defteri. Yoklamayı tek dokunuşla al, paketler kendiliğinden düşsün, kimin ne
              ödeyeceği hep önünde olsun. Excel ve WhatsApp karmaşasına son.
            </p>
            <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href="/giris">
                  Ücretsiz başla
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#nasil-calisir">Nasıl çalışır?</a>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {HERO_CHECKS.map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <span className="flex size-4 items-center justify-center rounded-full bg-success/15 text-success-strong">
                    <Check className="size-2.5" strokeWidth={3.5} aria-hidden />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto mt-14 max-w-4xl sm:mt-16">
            {/* Soft lime glow behind the device */}
            <div aria-hidden className="absolute top-1/4 left-1/2 -z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-lime/30 blur-[90px] dark:bg-lime/10" />
            <PhoneMockup className="relative" />

            {/* What arrives while the trainer is teaching. */}
            <div aria-hidden className="absolute top-28 left-0 hidden w-60 lg:block">
              <div className={cn(card, "flex items-center gap-3 rounded-2xl p-3 shadow-float")}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground">
                  <UserPlus className="size-4" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-medium">Yeni başvuru</span>
                  <span className="block text-xs text-muted-foreground">Deniz Y. · 12 Ders Özel</span>
                </span>
              </div>
            </div>
            <div aria-hidden className="absolute right-0 bottom-40 hidden w-60 lg:block">
              <div className={cn(card, "flex items-center gap-3 rounded-2xl p-3 shadow-float")}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <FileText className="size-4" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-medium">Dekont geldi</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">Zeynep K. · ₺1.333</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="ozellikler" aria-labelledby="features-heading" className="scroll-mt-20 px-4 pt-24 sm:px-6 sm:pt-32">
          <SectionHeading
            id="features-heading"
            eyebrow="Özellikler"
            lead="Stüdyonun tamamı tek ekranda."
            rest="Excel'e, not defterine, ayrı sohbetlere gerek yok."
          />
          <ul className="mx-auto mt-14 grid max-w-6xl gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, text, chips, Demo }) => (
              <li key={title} className={cn(card, "flex flex-col p-2")}>
                <div aria-hidden className="flex min-h-56 items-center justify-center rounded-[1.35rem] bg-canvas p-4 sm:p-5">
                  <Demo />
                </div>
                <div className="flex flex-1 flex-col gap-3 px-4 pt-5 pb-4">
                  <h3 className="text-lg leading-snug font-semibold tracking-[-0.02em]">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                  <div className="mt-auto pt-2">
                    <Chips items={chips} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Big numbers */}
        <section aria-labelledby="stats-heading" className="px-4 pt-24 sm:px-6 sm:pt-32">
          <div className="mx-auto max-w-6xl rounded-[1.75rem] bg-[#1d1d1f] px-6 py-12 text-white sm:px-12 sm:py-16 dark:border dark:bg-card">
            <h2 id="stats-heading" className="max-w-xl text-2xl leading-tight font-semibold tracking-[-0.03em] sm:text-3xl">
              Başlamak için ödeme yapman <span className="text-white/60">ya da bir şey kurman gerekmez.</span>
            </h2>
            <ul className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
              {STATS.map((s) => (
                <li key={s.value} className="border-t border-white/15 pt-5">
                  <p className="text-[2.75rem] leading-none font-semibold tracking-[-0.04em] text-lime tabular-nums sm:text-5xl">{s.value}</p>
                  <p className="mt-3 text-sm text-white/70">{s.label}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="nasil-calisir" aria-labelledby="how-heading" className="scroll-mt-20 px-4 pt-24 sm:px-6 sm:pt-32">
          <SectionHeading id="how-heading" eyebrow="Nasıl çalışır" lead="Üç adımda hazırsın." rest="Bu akşam kur, yarın kullan." />
          <ol className="mx-auto mt-14 grid max-w-6xl gap-4 sm:gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className={cn(card, "flex flex-col gap-3 p-7")}>
                <span className="mb-3 flex items-center gap-3 md:mb-6">
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                      i === 0 ? "bg-lime text-lime-foreground" : "bg-secondary text-foreground",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < STEPS.length - 1 && <span aria-hidden className="h-px flex-1 bg-border max-md:hidden" />}
                </span>
                <h3 className="text-lg font-semibold tracking-[-0.02em]">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Why */}
        <section aria-labelledby="why-heading" className="px-4 pt-24 sm:px-6 sm:pt-32">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow mb-4">Neden {APP_NAME}?</p>
              <h2 id="why-heading" className="text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-5xl sm:leading-[1.05]">
                <span className="text-foreground">Türkiye&apos;deki eğitmenler için yapıldı.</span>{" "}
                <span className="text-muted-foreground">Çeviri bir yazılım değil.</span>
              </h2>
            </div>
            <ol className={cn(card, "divide-y px-6 sm:px-8")}>
              {REASONS.map((r, i) => (
                <li key={r.title} className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-7 sm:grid-cols-[3.5rem_1fr]">
                  <span className="text-sm font-semibold text-muted-foreground tabular-nums sm:text-base" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.02em]">{r.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section id="sss" aria-labelledby="faq-heading" className="scroll-mt-20 px-4 pt-24 sm:px-6 sm:pt-32">
          <SectionHeading id="faq-heading" eyebrow="Sık sorulanlar" lead="Aklına takılanlar." rest="Kısa cevaplarıyla." />
          <div className={cn(card, "mx-auto mt-12 max-w-3xl divide-y")}>
            {FAQ.map(({ q, a }) => (
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

        {/* Final CTA */}
        <section aria-labelledby="cta-heading" className="px-4 pt-24 pb-16 sm:px-6 sm:pt-32 sm:pb-24">
          <div className="relative mx-auto flex max-w-6xl flex-col items-center overflow-hidden rounded-[1.75rem] bg-lime px-6 py-16 text-center text-lime-foreground sm:py-20">
            <span aria-hidden className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-lime-foreground text-lime">
              <Activity className="size-6" strokeWidth={2.5} />
            </span>
            <h2 id="cta-heading" className="max-w-2xl text-[2rem] leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
              Bu akşam Excel&apos;i kapat. Yarın dersini tek dokunuşla işle.
            </h2>
            <p className="mt-4 max-w-md text-base">Beta döneminde ücretsiz. Kurulum birkaç dakika sürer.</p>
            <Link
              href="/giris"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-lime-foreground px-7 text-base font-medium text-lime transition-opacity outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-lime-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-lime"
            >
              Ücretsiz başla
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-col gap-1">
            <Logo />
            <p className="text-sm text-muted-foreground">PT ve pilates eğitmenleri için danışan, paket ve ödeme takibi.</p>
          </div>
          <nav aria-label="Alt bilgi" className="flex flex-wrap gap-x-6 text-sm text-muted-foreground">
            {[
              { href: "/kvkk", label: "KVKK aydınlatma metni" },
              { href: "/giris", label: "Giriş yap" },
              { href: "#sss", label: "SSS" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center whitespace-nowrap hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
