import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, Dumbbell, Package, Salad, Smartphone, TrendingUp, Wallet, X } from "lucide-react";
import { Analytics } from "@/components/analytics";
import { Reveal } from "@/components/landing/reveal";
import { stagger } from "@/lib/motion";
import { ProgramDemo, ProgressDemo } from "@/components/landing/feature-demos";
import { Breadcrumbs, CtaBand, FaqSection, JsonLd, SectionHeading, SiteFooter, SiteHeader, card, pageJsonLd, type Faq } from "@/components/landing/site-chrome";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

const PATH = "/personal-trainer";
const TITLE = "Freelance Personal Trainer Uygulaması: Danışan ve PT Paketi Takibi";
const DESCRIPTION =
  "Serbest (freelance) çalışan personal trainer'lar için PT paketi ve kalan ders takibi, randevu, ödeme, antrenman programı, beslenme planı ve ölçüm. Danışan programını ve gelişimini kendi sayfasında görür. Beta süresince ücretsiz.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} · ${APP_NAME}`, description: DESCRIPTION, url: PATH, type: "website", locale: "tr_TR" },
};

const FEATURES = [
  {
    icon: Dumbbell,
    title: "Antrenman programı",
    text: "Hazır hareket listesinden programı gün gün kurun: set, tekrar, ağırlık, dinlenme, not. Şablonu bir kez hazırlayın, her danışana kopyalayıp düzenleyin. Danışan yaptığı günü işaretler, kimin programa uyduğunu görürsünüz.",
  },
  {
    icon: TrendingUp,
    title: "Ölçüm ve gelişim grafikleri",
    text: "Kilo, kas, yağ oranı, bel, göğüs, kol… Ölçümleri girin, danışan değişimi kendi sayfasında grafikle görsün. Ölçüm zamanı gelenler listenize düşer; isterseniz danışan kilosunu kendisi de girer.",
  },
  {
    icon: Salad,
    title: "Beslenme planı",
    text: "Öğün öğün öneriler ve günlük su, protein, adım hedefi. Planı yazdırabilir ya da PDF olarak kaydedebilirsiniz.",
  },
  {
    icon: Package,
    title: "PT paketleri",
    text: "10 derslik PT paketi, 2 taksit; 20 derslik paket peşin indirimli. Fiyatları siz koyarsınız, danışan ödeme şeklini kendisi seçer. İlk kez gelenler için deneme dersi de ekleyebilirsiniz.",
  },
  {
    icon: Wallet,
    title: "Kim ne kadar ödedi",
    text: "Taksit gününden bir gün önce danışana hatırlatma gider. Danışan parayı IBAN'ınıza gönderir, dekontu yükler; siz onaylarsınız. Nakit aldığınız ödemeyi de girersiniz.",
  },
  {
    icon: CalendarClock,
    title: "Randevuyu danışan alır",
    text: "Salonda hangi saatlerde olduğunuzu girin. Danışan boş saatlerden birini kendi seçer; iptal kuralınız ve kalan dersi randevuda da geçerli.",
  },
];

const NOT_DOING = [
  "Kalori sayımı ve besin veritabanı",
  "Kişiye özel diyet listesi (bu diyetisyenin işi)",
  "Kartla online tahsilat",
  "Salon üyeliği, turnike ya da kart okuyucu",
];

const FAQ: Faq[] = [
  {
    q: "Bir salonda ders veriyorum, salonun programı varken neden ayrı bir şey kullanayım?",
    a: `Salonun programı salonun üyesini tutar. Sizin kendi danışanınız, sattığınız PT paketi ve tahsilatınız ise genelde defterde ya da WhatsApp'ta kalır. ${APP_NAME} bu kısmı tutar: kimin kaç dersi kaldı, kim ne kadar ödedi.`,
  },
  {
    q: "Online PT yapıyorum, danışanıma uzaktan program gönderebilir miyim?",
    a: "Evet. Programı hazırlayıp gönderdiğinizde danışan kendi linkinden açar: hareketleri, set ve tekrarları, video linklerini ve çalışan kasları görür, yaptığı günleri işaretler. Kilosunu kendisi girebilir, siz de mesajla takip edersiniz. Yüz yüze ders olmadan da kullanılabilir.",
  },
  {
    q: "Antrenman programı yazabiliyor muyum?",
    a: "Evet. Hazır hareket listesinden (salon, reformer ve mat hareketleri) gün gün program kurarsınız; set, tekrar, ağırlık, dinlenme ve not yazarsınız, harekete video linki eklersiniz. Programı şablon olarak kaydedip başka danışanlara kopyalarsınız. Danışan programını kendi sayfasında görür ve antrenmanı yaptığı günleri işaretler.",
  },
  {
    q: "Beslenme planı verebilir miyim?",
    a: "Evet. Öğün öğün önerilerinizi ve günlük hedefleri (su, protein, adım) yazarsınız. Kalori hesabı ya da besin veritabanı yok; kişiye özel diyet listesi diyetisyenin işi olduğu için her planın altında bunu belirten bir not çıkar. Planı yazdırabilir ya da PDF olarak kaydedebilirsiniz.",
  },
  {
    q: "Danışanım ölçümlerini ve gelişimini görebiliyor mu?",
    a: "Evet. Girdiğiniz ölçümler danışanın sayfasında grafikle görünür; ilk ölçümden bu yana ne kadar değiştiğini görür. Ölçümler sağlık verisi sayıldığı için danışanın açık rızasıyla kaydedilir.",
  },
  {
    q: "Danışanım bir uygulama indirmek zorunda mı?",
    a: "Hayır. Her danışanın kişisel bir linki olur, tarayıcıda açılır. Mağazadan indirme ya da şifre gerekmez. İsteyen sayfayı ana ekranına ekleyip ders hatırlatmalarını bildirim olarak alır.",
  },
  {
    q: "Düet ya da küçük grup dersi verebilir miyim?",
    a: "Evet. Ders planlarken iki ya da üç danışan seçerseniz düet ya da trio olur. Kontenjanlı grup dersleri de açabilirsiniz; her danışanın dersi kendi paketinden düşer.",
  },
  {
    q: "Taksitli PT paketi satabilir miyim?",
    a: "Evet. Pakete taksitli fiyat ve taksit sayısını eklersiniz. Danışan kendi sayfasında vadesi gelen taksiti görür, havaleyi yapıp dekontunu yükler.",
  },
];

export default function PersonalTrainerPage() {
  return (
    <div data-marketing className="min-h-dvh overflow-x-clip bg-canvas">
      <Analytics />
      <Reveal />
      <JsonLd data={pageJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, crumbs: [{ href: PATH, label: "Personal trainer" }], faq: FAQ })} />
      <SiteHeader page="pt" />
      <Breadcrumbs items={[{ href: PATH, label: "Personal trainer" }]} />

      <main>
        <section aria-labelledby="hero-heading" className="px-4 pt-8 sm:px-6 sm:pt-14">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="anim-rise eyebrow mb-4">Serbest çalışan personal trainer&apos;lar için</p>
              <h1 id="hero-heading" style={{ "--delay": "80ms" } as React.CSSProperties} className="anim-rise text-[2.25rem] leading-[1.06] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
                Freelance personal trainer&apos;lar için danışan, PT paketi ve program takibi
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
                Antrenman programı, ölçümler ve beslenme planı danışanın kendi sayfasında. Paketten kaç ders kaldı, kim ne kadar
                ödedi, yarın kim geliyor; hepsi telefonunuzda.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/giris" data-umami-event="pt-basla" data-umami-event-yer="hero">
                    Ücretsiz başlayın
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/fiyatlar">Fiyatlar</Link>
                </Button>
              </div>
            </div>
            <div aria-hidden className="flex flex-col gap-3 rounded-[1.75rem] bg-card p-4 shadow-card sm:p-5">
              <ProgramDemo />
              <ProgressDemo />
            </div>
          </div>
        </section>

        <section aria-labelledby="scenario-heading" className="px-4 pt-20 sm:px-6 sm:pt-28">
          <div data-reveal className={cn(card, "mx-auto max-w-5xl p-6 sm:p-10")}>
            <h2 id="scenario-heading" className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Salonda ders veren serbest PT&apos;nin günü
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
              Sabah üç danışan, akşam iki. Biri dersi son anda iptal ediyor, biri taksitini gönderdiğini söylüyor, bir diğeri
              programını bu hafta yaptı mı belli değil. {APP_NAME} bunların hepsini tek yerde toplar: yoklamayı aldığınızda ders
              paketten düşer, dekontu gelen ödeme onayınızı bekler, danışan yaptığı antrenmanı işaretler, ölçümleri grafikte
              görürsünüz.
            </p>
          </div>
        </section>

        <section aria-labelledby="features-heading" className="px-4 pt-20 sm:px-6 sm:pt-28">
          <SectionHeading id="features-heading" eyebrow="Neler var" lead="Programdan tahsilata PT işiniz tek yerde." />
          <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
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

        <section aria-labelledby="not-heading" className="px-4 pt-20 sm:px-6 sm:pt-28">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
            <div data-reveal className={cn(card, "p-6 sm:p-8")}>
              <h2 id="not-heading" className="text-xl font-semibold tracking-[-0.02em]">
                {APP_NAME} ne yapmaz?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">Bilerek dışarıda bıraktıklarımız:</p>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                {NOT_DOING.map((n) => (
                  <li key={n} className="flex items-center gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden>
                      <X className="size-3" />
                    </span>
                    {n}
                  </li>
                ))}
              </ul>
            </div>
            <div data-reveal className={cn(card, "p-6 sm:p-8")}>
              <span className="flex size-10 items-center justify-center rounded-full bg-lime text-lime-foreground" aria-hidden>
                <Smartphone className="size-5" />
              </span>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">Danışanınız mağazadan bir şey indirmez</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Her danışanın kişisel bir linki olur. Linki açınca kalan derslerini, programını, ölçümlerini ve ödemelerini görür;
                randevu alır, dersini onaylar, size yazar. Sayfayı ana ekranına ekleyen danışana hatırlatmalar bildirim olarak gelir.
              </p>
            </div>
          </div>
        </section>

        <FaqSection items={FAQ} />

        <CtaBand
          page="pt"
          title="Programı yazın, gelişimi grafikte görün, ödemeleri telefondan takip edin."
          text="Beta süresince ücretsiz, kart bilgisi istemiyoruz."
        />
      </main>
      <SiteFooter />
    </div>
  );
}
