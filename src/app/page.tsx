import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Check,
  ClipboardList,
  FileSpreadsheet,
  Globe,
  Landmark,
  Link2,
  MessagesSquare,
  Package,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: { absolute: `${APP_NAME} · PT ve pilates eğitmenleri için danışan ve paket takibi` },
  description:
    "Danışanlarını, ders paketlerini, randevularını ve ödemelerini tek yerden yönet. Excel ve WhatsApp karmaşasına son. Beta döneminde ücretsiz.",
  openGraph: {
    title: `${APP_NAME} · Danışan, paket ve ödeme takibi`,
    description: "PT ve pilates eğitmenleri için. Danışanların uygulama indirmez; kendi linkinden kayıt olur, randevu alır, ödemesini bildirir.",
    type: "website",
  },
};

const PROBLEMS = [
  { icon: FileSpreadsheet, title: "Excel'de ders saymak", text: "Kimin kaç dersi kaldı, paketi ne zaman bitiyor? Her seferinde tabloya bakmak." },
  { icon: MessagesSquare, title: "WhatsApp'ta kaybolan mesajlar", text: "Randevu, iptal, dekont… hepsi farklı sohbetlerde, hepsi elle takip." },
  { icon: Wallet, title: "Kim ne kadar borçlu?", text: "Taksitler, havaleler, nakit ödemeler. Ay sonunda hesabı tutturmak zor." },
];

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Tek dokunuşla yoklama",
    text: "Geldi, gelmedi, geç iptal. Paketten otomatik düşer; telafi hakkı varsa ders yanmaz.",
  },
  {
    icon: Package,
    title: "Paketler ve taksitler",
    text: "8, 12 ya da 10 derslik paketler; özel, düet, grup. Tek çekim ya da taksitli ödeme planı.",
  },
  {
    icon: Globe,
    title: "Instagram için kişisel sayfa",
    text: "Fotoğrafın, tanıtımın ve paketlerin tek linkte. Bio'na koy, danışanın paketi seçip başvursun.",
  },
  {
    icon: ClipboardList,
    title: "Kendi kayıt formun",
    text: "Boy, kilo, hedef, sağlık durumu… Hangi bilgiyi soracağına sen karar ver. KVKK rızası formda.",
  },
  {
    icon: CalendarClock,
    title: "Danışan randevusunu alır",
    text: "Çalışma saatlerini gir; danışan boş saatlerden seçer. Çakışma olmaz, 24 saat kuralı işler.",
  },
  {
    icon: Landmark,
    title: "Havale bildirimi ve dekont",
    text: "Danışan IBAN'ına ödeme yapıp dekontunu yükler, sen onaylarsın. Para doğrudan senin hesabına.",
  },
];

const STEPS = [
  { title: "Paketlerini ve sayfanı hazırla", text: "Paketlerini, fiyatlarını, çalışma saatlerini ve kayıt formunu dakikalar içinde oluştur." },
  { title: "Linkini Instagram'da paylaş", text: "Danışanların sayfandan paketi seçer, formu doldurur ve başvurur." },
  { title: "Onayla ve takip et", text: "Başvuruyu onayla; dersler, ödemeler ve hatırlatmalar tek ekranda." },
];

const CLIENT_SIDE = [
  "Uygulama indirmeden, şifresiz kişisel link",
  "Kalan ders, paket bitiş tarihi ve taksit planı",
  "Boş saatlerden randevu alma ve iptal",
  "IBAN'a ödeme ve dekont yükleme",
];

const FAQ = [
  {
    q: "Danışanlarım bir uygulama indirmek zorunda mı?",
    a: "Hayır. Her danışanın kişisel bir linki olur; WhatsApp'tan ya da e-postayla gelir, tarayıcıda açılır. Şifre ya da hesap gerekmez.",
  },
  {
    q: "Ödemeler uygulamanın üzerinden mi geçiyor?",
    a: "Hayır. Danışan doğrudan senin IBAN'ına havale yapar ve bildirir; sen onaylarsın. Nakit ya da kartla aldığın ödemeleri de kendin girebilirsin.",
  },
  {
    q: "Danışanlarımın sağlık bilgileri güvende mi?",
    a: "Sağlık bilgileri yalnızca danışan açık rıza verirse sorulur ve saklanır. Her eğitmen sadece kendi danışanlarını görebilir; bu kural veritabanı seviyesinde uygulanır.",
  },
  {
    q: "Excel'deki danışan listemi aktarabilir miyim?",
    a: "Excel'den tek seferde aktarma yakında geliyor.",
  },
  {
    q: "Ücretli mi?",
    a: "Beta döneminde tamamen ücretsiz. Ücretli plana geçildiğinde beta kullanıcılarına önceden haber verilecek.",
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <Link href="/" className="flex items-center gap-2 font-heading text-xl font-semibold">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG logo */}
            <img src="/icon.svg" alt="" className="size-8" />
            {APP_NAME}
          </Link>
          <nav aria-label="Sayfa" className="hidden flex-1 items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#ozellikler" className="hover:text-foreground">
              Özellikler
            </a>
            <a href="#nasil-calisir" className="hover:text-foreground">
              Nasıl çalışır
            </a>
            <a href="#sss" className="hover:text-foreground">
              Sık sorulanlar
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
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
        <section className="mx-auto grid max-w-6xl items-center gap-16 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col items-start gap-6">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Beta · Eğitmenler için ücretsiz
            </span>
            <h1 className="text-3xl font-semibold text-balance">
              Danışanlarını, paketlerini ve ödemelerini tek yerden yönet.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">
              PT ve pilates eğitmenleri için ders defteri. Yoklamayı iki dokunuşta al, paketler kendiliğinden düşsün, kimin ne kadar
              ödeyeceği hep önünde olsun. Excel ve WhatsApp karmaşasına son.
            </p>
            <div className="flex flex-wrap gap-3">
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
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Kredi kartı gerekmez", "Danışanın uygulama indirmez", "Türkçe ve TL"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 text-success" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <PhoneMockup />
        </section>

        {/* Problem */}
        <section aria-labelledby="problem-heading" className="border-y bg-muted/50">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 id="problem-heading" className="mb-8 text-2xl font-semibold">
              Hâlâ bunlarla mı uğraşıyorsun?
            </h2>
            <ul className="grid gap-4 md:grid-cols-3">
              {PROBLEMS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex flex-col gap-2 rounded-2xl border bg-card p-6">
                  <Icon className="size-6 text-muted-foreground" aria-hidden />
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-base font-medium">
              {APP_NAME} bunların hepsini senin yerine takip eder; sen derse odaklanırsın.
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="ozellikler" aria-labelledby="features-heading" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 md:py-24">
          <div className="mb-12 max-w-2xl">
            <h2 id="features-heading" className="mb-4 text-2xl font-semibold">
              Eğitmenin ihtiyacı olan her şey, fazlası değil
            </h2>
            <p className="text-base text-muted-foreground">
              Türkiye&apos;deki paket ve ders alışkanlıklarına göre tasarlandı: 24 saat iptal kuralı, telafi hakkı, dondurma, taksit.
            </p>
          </div>
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex flex-col gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section id="nasil-calisir" aria-labelledby="how-heading" className="scroll-mt-16 border-y bg-muted/50">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <h2 id="how-heading" className="mb-12 text-2xl font-semibold">
              Üç adımda başla
            </h2>
            <ol className="grid gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex flex-col gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary font-heading text-base font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="text-base font-semibold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Client side */}
        <section aria-labelledby="client-heading" className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col gap-4">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="size-5" aria-hidden />
            </span>
            <h2 id="client-heading" className="text-2xl font-semibold">
              Danışanların için de kolay
            </h2>
            <p className="text-base text-muted-foreground">
              Danışanın bir uygulama daha indirmek zorunda kalmaz. Her danışanın kendine özel bir sayfası olur; linki WhatsApp&apos;tan
              gönderirsin.
            </p>
            <ul className="flex flex-col gap-3">
              {CLIENT_SIDE.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-6 shadow-sm" aria-hidden>
            <p className="text-sm text-muted-foreground">Elif Pilates</p>
            <p className="font-heading text-2xl font-semibold">Merhaba Zeynep</p>
            <div className="rounded-xl border p-4">
              <p className="mb-2 text-sm font-medium">8 Ders Özel Reformer</p>
              <p className="mb-3">
                <span className="font-heading text-3xl font-semibold tabular-nums">5</span>
                <span className="text-sm text-muted-foreground"> / 8 ders kaldı</span>
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-5/8 rounded-full bg-primary" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-4 text-sm">
              <span>
                <span className="block font-medium">2. taksit</span>
                <span className="text-muted-foreground">29 Eki · ₺1.333</span>
              </span>
              <span className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">Ödemeyi yaptım</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border p-4 text-sm">
              <Link2 className="size-4 text-primary" />
              <span className="text-muted-foreground">Uygulama yok, şifre yok. Sadece bir link.</span>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section aria-labelledby="pricing-heading" className="border-y bg-muted/50">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-16 text-center md:py-24">
            <div className="flex max-w-2xl flex-col gap-4">
              <h2 id="pricing-heading" className="text-2xl font-semibold">
                Beta döneminde ücretsiz
              </h2>
              <p className="text-base text-muted-foreground">
                İlk eğitmenlerle birlikte geliştiriyoruz. Şimdi katıl, tüm özellikleri ücretsiz kullan, geri bildiriminle ürünü sen de
                şekillendir.
              </p>
            </div>
            <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-8 text-left shadow-sm">
              <div>
                <p className="text-sm font-medium text-primary">Beta</p>
                <p className="font-heading text-3xl font-semibold">₺0</p>
                <p className="text-sm text-muted-foreground">Danışan sayısı sınırı yok · Kart gerekmez</p>
              </div>
              <ul className="flex flex-col gap-3 text-sm">
                {[
                  "Sınırsız danışan, paket ve ders",
                  "Kişisel sayfa ve online kayıt formu",
                  "Randevu, taksit ve havale takibi",
                  "WhatsApp hatırlatma mesajları",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg">
                <Link href="/giris">Ücretsiz başla</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="sss" aria-labelledby="faq-heading" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-16 md:py-24">
          <h2 id="faq-heading" className="mb-8 text-2xl font-semibold">
            Sık sorulanlar
          </h2>
          <div className="divide-y rounded-2xl border">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group px-6 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-base font-medium">
                  {q}
                  <span className="text-xl text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="pt-2 pb-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section aria-labelledby="cta-heading" className="px-4 pb-16 md:pb-24">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground">
            <h2 id="cta-heading" className="max-w-2xl text-2xl font-semibold text-balance">
              Bu akşam Excel&apos;i kapat, yarın dersini tek dokunuşla işle.
            </h2>
            <Button asChild size="lg" variant="secondary">
              <Link href="/giris">
                Ücretsiz başla
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-4" aria-hidden />
            {APP_NAME} · PT ve pilates eğitmenleri için
          </p>
          <nav aria-label="Alt bilgi" className="flex flex-wrap gap-x-6">
            {[
              { href: "/kvkk", label: "KVKK aydınlatma metni" },
              { href: "/giris", label: "Giriş yap" },
              { href: "#sss", label: "Sık sorulanlar" },
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
