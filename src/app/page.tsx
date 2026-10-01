import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Dumbbell,
  CalendarCheck,
  Check,
  ClipboardCheck,
  MessageSquareText,
  Smartphone,
  StickyNote,
  UserPlus,
  UserRoundSearch,
} from "lucide-react";
import {
  AttendanceDemo,
  BodyMapDemo,
  BookingDemo,
  ConfirmDemo,
  ExerciseCardsDemo,
  GroupDemo,
  ImportDemo,
  InstallmentDemo,
  MessagesDemo,
  NutritionDemo,
  PaymentDemo,
  PricingDemo,
  ProgramDemo,
  ProgressDemo,
  PublicPageDemo,
} from "@/components/landing/feature-demos";
import { Analytics } from "@/components/analytics";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { Reveal } from "@/components/landing/reveal";
import { stagger } from "@/lib/motion";
import { Chips, CtaBand, FaqSection, JsonLd, SectionHeading, SiteFooter, SiteHeader, card } from "@/components/landing/site-chrome";
import { Button } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_DOMAIN, APP_NAME, siteUrl } from "@/lib/config";
import { LEGAL } from "@/lib/legal";
import { cn } from "@/lib/utils";

const TITLE = `${APP_NAME} · Pilates ve PT için Danışan ve Seans Takibi`;
const DESCRIPTION =
  "Pilates ve PT eğitmenleri için danışan takip programı. Seans paketi, yoklama, randevu, ödeme, antrenman programı, beslenme planı ve ölçüm takibi tek yerde. Beta süresince ücretsiz.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  keywords: [
    "pilates stüdyo programı",
    "personal trainer uygulaması",
    "danışan takip programı",
    "seans takip",
    "seans paketi takibi",
    "pilates randevu sistemi",
    "reformer pilates",
    "grup dersi kontenjan",
    "ders hatırlatma",
    "deneme dersi",
    "antrenman programı",
    "beslenme planı",
    "vücut ölçüsü takibi",
  ],
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website", siteName: APP_NAME, locale: "tr_TR" },
};

const FEATURES = [
  {
    title: "Yoklamayı alın, seans paketten otomatik düşsün",
    text: "Geldi mi, gelmedi mi, son anda mı iptal etti? Tek dokunuşla işaretleyin, kalan seans hemen güncellensin. Telafi hakkı varsa ders yanmaz.",
    chips: ["Yoklama", "Telafi hakkı", "24 saat kuralı", "Kalan seans"],
    Demo: AttendanceDemo,
  },
  {
    title: "Dersten önce “Geliyor musun?”",
    text: "Dersten önce danışana hatırlatma gider, ne zaman gideceğini siz seçersiniz. Danışan “Geliyorum” ya da “Gelemiyorum” diye cevap verir; yarın kimin geleceğini bugünden bilirsiniz.",
    chips: ["Ders hatırlatması", "Katılım onayı", "Boş kalan saat"],
    Demo: ConfirmDemo,
  },
  {
    title: "Instagram bio'nuza koyacağınız sayfa",
    text: "Tanıtımınız, paketleriniz ve fiyatlarınız tek linkte. Danışan paketini seçip formu doldursun, siz onaylayın.",
    chips: ["Kişisel sayfa", "Online kayıt", "Başvuru onayı", "Açık rıza"],
    Demo: PublicPageDemo,
  },
  {
    title: "Seans paketleri: indirimli, peşin ya da taksitli",
    text: "Özel, düet ve grup paketlerinizi tanımlayın; indirimi ve taksit sayısını siz belirleyin. Paketi biten danışana yenileme teklifi otomatik gider.",
    chips: ["Seans paketi", "İndirim", "Taksit", "Deneme dersi", "Yenileme"],
    Demo: PricingDemo,
  },
  {
    title: "Grup derslerinde kontenjan ve sabit yer",
    text: "Kontenjanı belirleyin, düzenli gelenlerin yerini sabitleyin. Boş kalan yerlere danışanlar kendileri yazılsın.",
    chips: ["Kontenjan", "Sabit yer", "Derse yazılma"],
    Demo: GroupDemo,
  },
  {
    title: "Danışan randevusunu kendisi alır",
    text: "Çalışma saatlerinizi girin, danışan boş bir saat seçsin. Çakışma olmaz; iptalde sizin kuralınız geçerli.",
    chips: ["Online randevu", "Çalışma saatleri", "İptal kuralı"],
    Demo: BookingDemo,
  },
  {
    title: "Danışanlarınızla uygulamadan yazışın",
    text: "Saat değişikliği, soru, hatırlatma… Mesajlar kişisel numaranıza değil uygulamaya gelir, yeni mesajda ikinizin de telefonuna bildirim düşer. İsterseniz aynı hazır metinle WhatsApp'tan da yazarsınız.",
    chips: ["Mesajlaşma", "Anlık bildirim", "Görüldü"],
    Demo: MessagesDemo,
  },
  {
    title: "Taksit günü gelince hatırlatma gider",
    text: "Taksit gününden bir gün önce danışana bildirim gider, sayfasının en üstünde de görünür. Danışan IBAN'ınıza havale yapıp dekontu yükler, siz onaylarsınız.",
    chips: ["Taksit hatırlatması", "IBAN", "Dekont", "Onay"],
    Demo: InstallmentDemo,
  },
  {
    title: "Ödeme bekleyenlere hazır mesaj",
    text: "Kimin ne kadar borcu olduğunu tek listede görün. Paketi bitmek üzere olanlara ve ödemesi gecikenlere hazır metinle yazın.",
    chips: ["Bekleyen ödeme", "Hazır mesaj", "WhatsApp"],
    Demo: PaymentDemo,
  },
  {
    title: "Excel'deki listenizi birkaç dakikada aktarın",
    text: "Danışan listenizi Excel ya da CSV olarak yükleyin; kalan seanslar ve borçlar da gelsin. Verilerinizi istediğiniz zaman Excel olarak indirebilirsiniz.",
    chips: ["Excel'den aktar", "Kalan seans", "Excel'e aktar"],
    Demo: ImportDemo,
  },
];

const MORE = [
  { icon: StickyNote, title: "Danışan notları", text: "Ders notlarını yoklamadan yazın. Sakatlık gibi bir uyarı varsa ders listesinde adının yanında görünür." },
  { icon: MessageSquareText, title: "Kendi cümlelerinizle", text: "Hatırlatmaların ne zaman gideceğini ve hazır mesajların metnini siz belirlersiniz." },
  { icon: CalendarCheck, title: "Her pazartesi haftalık özet", text: "Geçen hafta kaç ders verdiniz, kimler geldi, ne kadar tahsil ettiniz; tek bildirimde." },
  { icon: UserRoundSearch, title: "Bir süredir gelmeyenler", text: "Üç haftadır gelmeyen danışanları bir listede görün, WhatsApp'tan hemen yazın." },
  { icon: ClipboardCheck, title: "Yoklama ekranı", text: "Almayı unuttuğunuz yoklamalar burada birikir. Grup dersinde “Hepsi geldi” deyip geçin." },
  { icon: Smartphone, title: "Mağazadan indirmeden ana ekranda", text: "Siz de danışanlarınız da ana ekrana ekleyin; hatırlatmalar ve mesajlar telefona bildirim olarak gelsin." },
];

const PROGRESS = [
  {
    title: "Ölçümler ve grafikler",
    text: "Kilo, kas, yağ oranı, bel, göğüs… Hangi ölçüleri tuttuğunuzu siz seçersiniz, kendi ölçünüzü de eklersiniz. Danışan değişimi kendi sayfasında grafikle görür, isterse kilosunu kendisi girer.",
    chips: ["Vücut ölçüleri", "Grafik", "Ölçüm hatırlatması"],
    Demo: ProgressDemo,
  },
  {
    title: "Antrenman programı",
    text: "200'den fazla hazır hareketten programı gün gün kurun; set, tekrar, ağırlık ya da yay ayarını yazın. Şablonu bir kez hazırlayıp danışana kopyalarsınız. Danışan yaptığı günü işaretler, kimin programa uyduğunu görürsünüz.",
    chips: ["Hazır hareketler", "Vücut haritası", "Şablon", "Yaptım"],
    Demo: ProgramDemo,
  },
  {
    title: "Beslenme planı",
    text: "Öğün öğün öneriler; günlük su, protein ve adım hedefi. Diyetisyenin hazırladığı listeyi PDF olarak da ekleyebilirsiniz.",
    chips: ["Öğünler", "Günlük hedef", "PDF"],
    Demo: NutritionDemo,
  },
];

const STATS = [
  { value: "₺0", label: "Beta boyunca ücret" },
  { value: "%0", label: "Ödemelerden komisyon; para doğrudan IBAN'ınıza gelir" },
  { value: "1 gün", label: "Önceden danışana “Geliyor musun?” hatırlatması gider; süreyi siz seçersiniz" },
];

const STEPS = [
  {
    title: "Paketlerinizi ve sayfanızı hazırlayın",
    text: "Seans paketlerini, fiyatları, çalışma saatlerinizi ve kayıt formunu girin. Birkaç dakikanızı alır.",
  },
  {
    title: "Linkinizi Instagram'da paylaşın",
    text: "Danışan sayfanıza girip paketini seçer, formu doldurur. Hesap açması, şifre belirlemesi gerekmez.",
  },
  {
    title: "Başvuruyu onaylayın",
    text: "Onayladığınız danışan listenize eklenir. Seanslarını, yoklamasını ve ödemelerini buradan takip edersiniz.",
  },
];

const REASONS = [
  {
    title: "Alıştığınız paket düzeni",
    text: "Telafi hakkı, 24 saat iptal kuralı, taksit, TL fiyat. Stüdyolarda iş nasıl dönüyorsa program da öyle çalışır.",
  },
  {
    title: "Danışanınız uygulama indirmez",
    text: "Her danışanın kendine ait bir linki olur, tarayıcıda açılır. İsteyen ana ekranına ekler, bildirimleri telefonunda görür. Şifre de mağaza da yok.",
  },
  {
    title: "Paranız doğrudan IBAN'ınıza gelir",
    text: "Ödemeler bizden geçmez, komisyon almayız. Danışan havale yapar, dekontu yükler, siz onaylarsınız.",
  },
  {
    title: "Sağlık bilgisi rıza olmadan tutulmaz",
    text: "Sağlık soruları ve vücut ölçümleri danışanın açık rızasıyla kaydedilir. Her eğitmen yalnızca kendi danışanlarını görür.",
  },
];

const FAQ = [
  {
    q: `${APP_NAME} nedir?`,
    a: `${APP_NAME}, Türkiye'de kendi danışanlarıyla çalışan pilates eğitmenleri ve personal trainer'lar için web tabanlı bir danışan ve seans takip programı. Seans paketlerini, yoklamayı, randevuları, ders hatırlatmalarını ve IBAN'a gelen ödemeleri tek hesapta tutar. Danışanlar uygulama indirmez; kendilerine gönderilen linki tarayıcıda açar.`,
  },
  {
    q: "Stüdyomda birden fazla eğitmen var, kullanabilir miyiz?",
    a: `${APP_NAME} şimdilik tek başına çalışan eğitmenler için. Stüdyonuzda birkaç eğitmen varsa her biri kendi hesabını açar ve yalnızca kendi danışanlarını görür; eğitmenlerin ortak kullandığı bir takvim şu an yok.`,
  },
  {
    q: "Geç iptal ve telafi hakkı nasıl işliyor?",
    a: "Ücretsiz iptal süresini siz belirlersiniz (0 ile 48 saat arası). Danışan bu süre geçtikten sonra iptal ederse ders paketinden düşer. Paketinde telafi hakkı varsa önce o kullanılır, ders yanmaz.",
  },
  {
    q: "Danışanlarımın bir uygulama indirmesi gerekiyor mu?",
    a: "Hayır. Her danışanın kendine ait bir linki olur. Linki WhatsApp'tan ya da e-postayla gönderirsiniz, danışan tarayıcıda açar. Şifre ya da hesap gerekmez. İsteyen sayfayı ana ekranına ekler; ders hatırlatmaları ve mesajlar telefonuna bildirim olarak gelir.",
  },
  {
    q: "Bildirimler nasıl geliyor?",
    a: `${APP_NAME}'u telefonunuzun ana ekranına ekleyin; yeni başvuru, randevu, iptal, havale ya da mesaj geldiğinde telefonunuza bildirim düşer. Hangi bildirimleri ve e-postaları almak istediğinizi ayarlardan seçersiniz. iPhone'da iOS 16.4 ya da üstü gerekir.`,
  },
  {
    q: "Danışanlarıma antrenman programı ve beslenme planı verebilir miyim?",
    a: "Evet. Hazır hareket listesinden gün gün antrenman programı kurarsınız: set, tekrar, ağırlık, dinlenme ve not. Beslenme planında öğünleri ve günlük hedefleri yazarsınız, isterseniz PDF eklersiniz. Şablon olarak kaydettiğiniz programı başka danışanlara kopyalayıp kişiye göre düzenlersiniz. Danışan programını kendi sayfasında görür, antrenmanı yaptığı günleri işaretler.",
  },
  {
    q: "Danışanım ölçümlerini görebiliyor mu?",
    a: "Evet. Girdiğiniz ölçümler danışanın sayfasındaki İlerlemem sekmesinde grafikle görünür. İzin verirseniz danışan kilosunu kendisi de girer. Ölçümler sağlık verisi sayıldığı için danışanın açık rızasıyla kaydedilir.",
  },
  {
    q: `Ödemeler ${APP_NAME} üzerinden mi geçiyor?`,
    a: "Hayır. Danışan parayı doğrudan sizin IBAN'ınıza gönderir, dekontu yükler, siz onaylarsınız. Nakit ya da kartla aldığınız ödemeleri de kendiniz girersiniz.",
  },
  {
    q: "Yalnızca pilates eğitmenleri için mi?",
    a: "Hayır. Reformer ve mat pilates eğitmenleri de, personal trainer'lar ve grup dersi verenler de kullanabilir. Özel, düet ve grup derslerini aynı yerden takip edersiniz.",
  },
  {
    q: "Danışanlarımın sağlık bilgileri güvende mi?",
    a: "Sağlık bilgisi yalnızca danışan açık rıza verirse sorulur ve saklanır. Her eğitmen sadece kendi danışanlarını görür; bu ayrım doğrudan veritabanında yapılır.",
  },
  {
    q: "Excel'deki danışan listemi aktarabilir miyim?",
    a: "Evet. Listenizi Excel ya da CSV olarak yükleyin, sütunları eşleştirin, önizlemeye bakıp aktarın. Kalan seanslar ve borçlar da gelir. Aynı telefon numarası iki kez eklenmez.",
  },
  {
    q: `${APP_NAME} ücretli mi?`,
    a: "Beta süresince eğitmenler için ücretsiz, kart bilgisi de istemiyoruz. Ücretli plana geçmeden en az bir hafta önce haber veririz; beta kullanıcılarına ilk abonelikte indirim yapacağız. Devam edip etmemek size kalır, verilerinizi istediğiniz an Excel olarak indirebilirsiniz.",
  },
  {
    q: "Verilerim nerede saklanıyor?",
    a: "Veriler Almanya'daki (Frankfurt) bir veri merkezinde tutulur. Satılmaz, reklam için kullanılmaz. Hesabınızı sildiğinizde danışan kayıtlarınız da kalıcı olarak silinir. Ayrıntılar KVKK Aydınlatma Metni'nde.",
  },
  {
    q: `${APP_NAME}'u kim yapıyor?`,
    a: `${APP_NAME}'u ${LEGAL.controller} geliştiriyor. Sorunuz, öneriniz ya da takıldığınız bir yer varsa ${LEGAL.email} adresine yazabilirsiniz.`,
  },
];

const HERO_CHECKS = ["Kredi kartı gerekmez", "Danışanlarınız uygulama indirmez", "Türkçe arayüz, TL fiyatlar"];

const AUDIENCES = [
  {
    href: "/pilates-egitmenleri",
    icon: Activity,
    title: "Pilates eğitmenleri",
    text: "Reformer ve mat; özel, düet ve grup paketleri, telafi hakkı, reformer kontenjanı.",
  },
  {
    href: "/personal-trainer",
    icon: Dumbbell,
    title: "Personal trainer'lar",
    text: "Salonda ders veren serbest PT'ler; PT paketleri, taksit, randevu ve tahsilat.",
  },
];

// Structured data: what the product is (no ratings or reviews: there are none yet) and the FAQ.
const SITE = siteUrl();
// One linked graph: who makes it (Organization), the site, this page and the product.
// No ratings or reviews: there are none yet.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: APP_NAME,
      alternateName: [APP_DOMAIN, `${APP_NAME} App`],
      url: SITE,
      logo: { "@type": "ImageObject", url: `${SITE}/pwa-icon/512`, width: 512, height: 512 },
      email: LEGAL.email,
      founder: { "@type": "Person", name: LEGAL.controller },
      areaServed: { "@type": "Country", name: "Türkiye" },
      description: APP_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: APP_NAME,
      inLanguage: "tr-TR",
      publisher: { "@id": `${SITE}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE}/#webpage`,
      url: SITE,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "tr-TR",
      isPartOf: { "@id": `${SITE}/#website` },
      about: { "@id": `${SITE}/#software` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE}/#software`,
      name: APP_NAME,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Danışan ve seans takip programı",
      featureList: [
        "Seans paketi ve kalan ders takibi",
        "Yoklama, telafi hakkı ve geç iptal kuralı",
        "Online randevu ve grup dersi kontenjanı",
        "Ders, taksit ve ölçüm hatırlatması",
        "IBAN'a havale ve dekont onayı",
        "Antrenman programı ve hareket listesi",
        "Beslenme planı",
        "Vücut ölçüsü takibi ve grafikler",
        "Danışanla mesajlaşma",
      ],
      // A web app; it can be added to the home screen, but there is no store app.
      operatingSystem: "Web",
      inLanguage: "tr-TR",
      description: DESCRIPTION,
      url: SITE,
      publisher: { "@id": `${SITE}/#organization` },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "TRY",
        availability: "https://schema.org/InStock",
        url: `${SITE}/giris`,
        description: "Beta süresince ücretsiz",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE}/#faq`,
      mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ],
};

export default function Home() {
  return (
    <div data-marketing className="min-h-dvh overflow-x-clip bg-canvas">
      <Analytics />
      <Reveal />
      <JsonLd data={JSON_LD} />
      <SiteHeader page="landing" />

      <main>
        {/* Hero */}
        <section aria-labelledby="hero-heading" className="relative px-4 pt-14 sm:px-6 sm:pt-20 lg:pt-24">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <p className="anim-rise mb-7 inline-flex items-center gap-2 rounded-full border bg-card py-1.5 pr-3.5 pl-2 text-xs font-medium shadow-card sm:text-sm">
              <span className="rounded-full bg-lime px-2 py-0.5 text-lime-foreground">Beta</span>
              Eğitmenlere ücretsiz
            </p>
            <h1
              id="hero-heading"
              style={{ "--delay": "80ms" } as React.CSSProperties}
              className="anim-rise text-[2.5rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.5rem]"
            >
              <span className="block text-foreground">Defteri bırakın.</span>{" "}
              <span className="block text-muted-foreground">Pilates ve PT danışan takibini {APP_NAME} yapsın.</span>
            </h1>
            <p
              style={{ "--delay": "180ms" } as React.CSSProperties}
              className="anim-rise mt-6 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg"
            >
              Kendi danışanlarıyla çalışan pilates eğitmenleri ve personal trainer&apos;lar için seans paketi, yoklama, randevu, ödeme,
              antrenman programı ve ölçüm takibi. Yoklamayı aldığınızda kalan seans paketten düşer; danışanınız gelişimini kendi
              sayfasında görür.
            </p>
            <div
              style={{ "--delay": "280ms" } as React.CSSProperties}
              className="anim-rise mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
            >
              <Button asChild size="lg">
                <Link href="/giris" data-umami-event="landing-basla" data-umami-event-yer="hero">
                  Ücretsiz başlayın
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#nasil-calisir">Nasıl çalışıyor?</a>
              </Button>
            </div>
            <ul
              style={{ "--delay": "360ms" } as React.CSSProperties}
              className="anim-rise mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
            >
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

          <div style={{ "--delay": "450ms" } as React.CSSProperties} className="anim-rise relative mx-auto mt-14 max-w-4xl sm:mt-16">
            {/* Soft lime glow behind the device */}
            <div aria-hidden className="absolute top-1/4 left-1/2 -z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-lime/30 blur-[90px] dark:bg-lime/10" />
            <PhoneMockup className="relative" />

            {/* What arrives while the trainer is teaching. */}
            <div aria-hidden className="absolute top-28 left-0 hidden w-60 lg:block">
              <div className={cn(card, "anim-float flex items-center gap-3 rounded-2xl p-3 shadow-float")}>
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
              <div
                style={{ "--delay": "-3s" } as React.CSSProperties}
                className={cn(card, "anim-float flex items-center gap-3 rounded-2xl p-3 shadow-float")}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Check className="size-4 text-success-strong" strokeWidth={3} />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-medium">Zeynep K. geliyor</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">Yarın 10:00 · onayladı</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for: the way into the audience pages (also on phones, where the header has no menu). */}
        <section aria-labelledby="audience-heading" className="px-4 pt-20 sm:px-6 sm:pt-28">
          <h2 id="audience-heading" data-reveal className="eyebrow mb-5 text-center">
            Kimin için?
          </h2>
          <ul className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {AUDIENCES.map(({ href, icon: Icon, title, text }, i) => (
              <li key={href} data-reveal style={stagger(i, 2)}>
                <Link href={href} className={cn(card, "hover-lift group flex h-full items-start gap-4 p-5 sm:p-6")}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground" aria-hidden>
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-lg font-semibold tracking-[-0.02em]">
                      {title}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Progress: measurements, workout programs and nutrition plans */}
        <section id="gelisim" aria-labelledby="progress-heading" className="scroll-mt-20 px-4 pt-24 sm:px-6 sm:pt-32">
          <SectionHeading
            id="progress-heading"
            eyebrow="Gelişim takibi"
            lead="Ölçüm, antrenman ve beslenme de burada."
            rest="Danışanınız programını ve ilerlemesini kendi sayfasında görür."
          />
          <ul className="mx-auto mt-14 grid max-w-6xl gap-4 sm:gap-5 md:grid-cols-3">
            {PROGRESS.map(({ title, text, chips, Demo }, i) => (
              <li key={title} data-reveal style={stagger(i, 3)} className={cn(card, "hover-lift flex flex-col p-2 ring-1 ring-lime/40")}>
                <div aria-hidden className="flex min-h-64 items-center justify-center rounded-[1.35rem] bg-canvas p-4 sm:p-5">
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

          {/* The body map: the one visual a client remembers. */}
          <div data-reveal className={cn(card, "mx-auto mt-4 grid max-w-6xl gap-6 p-2 sm:mt-5 lg:grid-cols-2 lg:items-center lg:gap-10")}>
            <div className="flex flex-col gap-4 px-4 pt-5 lg:order-2 lg:px-6 lg:py-8">
              <p className="eyebrow">Vücut haritası</p>
              <h3 className="text-2xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-3xl">
                Hangi hareket hangi kası çalıştırıyor, danışanınız görsün.
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                200&apos;den fazla hazır hareketin her birinde ana ve yardımcı kaslar işaretli. Danışan programını açınca o günün çalışan
                kaslarını ön ve arka vücut figüründe görür, harekete dokununca kendi kaslarını. Kendi eklediğiniz harekette kası
                figüre dokunarak siz seçersiniz.
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                {["Makine, serbest ağırlık, reformer ve mat hareketleri", "Ana kas lime, yardımcı kas açık tonda", "Programdaki her günün kas haritası"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground" aria-hidden>
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div aria-hidden className="grid gap-3 rounded-[1.35rem] bg-canvas p-4 sm:grid-cols-[1.1fr_1fr] sm:p-5 lg:order-1">
              <BodyMapDemo />
              <ExerciseCardsDemo />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="ozellikler" aria-labelledby="features-heading" className="scroll-mt-20 px-4 pt-24 sm:px-6 sm:pt-32">
          <SectionHeading
            id="features-heading"
            eyebrow="Özellikler"
            lead="Seans paketinden ödemeye her şey tek yerde."
            rest="Deftere, Excel'e, dağınık WhatsApp mesajlarına gerek kalmaz."
          />
          <p data-reveal className="mt-6 text-center">
            <Link href="/ozellikler" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline">
              Bütün özellikler, konu konu
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </p>
          <ul className="mx-auto mt-14 grid max-w-6xl gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, text, chips, Demo }, i) => (
              <li key={title} data-reveal style={stagger(i)} className={cn(card, "hover-lift flex flex-col p-2")}>
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
          <ul className="mx-auto mt-4 grid max-w-6xl gap-4 sm:mt-5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {MORE.map(({ icon: Icon, title, text }, i) => (
              <li key={title} data-reveal style={stagger(i, 3)} className={cn(card, "hover-lift flex gap-4 p-5 sm:flex-col sm:gap-3 sm:p-6")}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground" aria-hidden>
                  <Icon className="size-5" />
                </span>
                <div className="flex min-w-0 flex-col gap-1 sm:gap-3">
                  <h3 className="text-base font-semibold tracking-[-0.02em]">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Big numbers */}
        <section aria-labelledby="stats-heading" className="px-4 pt-24 sm:px-6 sm:pt-32">
          <div data-reveal className="mx-auto max-w-6xl rounded-[1.75rem] bg-[#1d1d1f] px-6 py-12 text-white sm:px-12 sm:py-16 dark:border dark:bg-card">
            <h2 id="stats-heading" className="max-w-xl text-2xl leading-tight font-semibold tracking-[-0.03em] sm:text-3xl">
              Başlamak için <span className="text-white/60">kart bilgisi ya da uygulama indirmek gerekmez.</span>
            </h2>
            <ul className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
              {STATS.map((s, i) => (
                <li key={s.value} data-reveal style={stagger(i, 3, 140)} className="border-t border-white/15 pt-5">
                  <p className="text-[2.75rem] leading-none font-semibold tracking-[-0.04em] text-lime tabular-nums sm:text-5xl">{s.value}</p>
                  <p className="mt-3 text-sm text-white/70">{s.label}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="nasil-calisir" aria-labelledby="how-heading" className="scroll-mt-20 px-4 pt-24 sm:px-6 sm:pt-32">
          <SectionHeading id="how-heading" eyebrow="Nasıl çalışıyor" lead="Üç adımda hazırsınız." rest="Akşam kurun, ertesi gün kullanın." />
          <ol className="mx-auto mt-14 grid max-w-6xl gap-4 sm:gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} data-reveal style={stagger(i, 3, 120)} className={cn(card, "flex flex-col gap-3 p-7")}>
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
            <div data-reveal className="lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow mb-4">Neden {APP_NAME}?</p>
              <h2 id="why-heading" className="text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-5xl sm:leading-[1.05]">
                <span className="text-foreground">Türkiye&apos;deki eğitmenlerin çalışma düzenine göre hazırlandı.</span>{" "}
                <span className="text-muted-foreground">Yabancı bir programın çevirisi değil.</span>
              </h2>
            </div>
            <ol data-reveal className={cn(card, "divide-y px-6 sm:px-8")}>
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

        <FaqSection items={FAQ} />

        <CtaBand
          page="landing"
          title="Defteri bu akşam kapatın. Yarınki yoklamayı telefondan alın."
          text="Beta döneminde ücretsiz. Kurulum birkaç dakika sürer."
        />
      </main>

      <SiteFooter />
    </div>
  );
}
