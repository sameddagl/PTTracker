import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Bell,
  BellRing,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  ClipboardCheck,
  ClipboardList,
  Copy,
  Download,
  Dumbbell,
  FileSpreadsheet,
  FileText,
  Gift,
  Globe,
  Link2,
  ListChecks,
  Lock,
  MessageSquareText,
  MessagesSquare,
  Package,
  Percent,
  PersonStanding,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Ruler,
  Salad,
  Search,
  Send,
  Server,
  ShieldCheck,
  Smartphone,
  StickyNote,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserRoundSearch,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Analytics } from "@/components/analytics";
import {
  BodyMapDemo,
  BookingDemo,
  ImportDemo,
  InstallmentDemo,
  MessagesDemo,
  ProgressDemo,
  PortalPhonesDemo,
  PublicPageDemo,
  TeamCalendarDemo,
} from "@/components/landing/feature-demos";
import { Reveal } from "@/components/landing/reveal";
import { Breadcrumbs, CtaBand, FaqSection, JsonLd, SiteFooter, SiteHeader, card, pageJsonLd, type Faq } from "@/components/landing/site-chrome";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

const PATH = "/ozellikler";
const TITLE = "Özellikler: Kayıttan Programa, Randevudan Ödemeye";
const DESCRIPTION = `${APP_NAME} özellikleri konu konu: kişisel sayfa ve online kayıt, randevu ve yoklama, seans paketi ve taksit, antrenman programı ve vücut haritası, beslenme planı, ölçüm grafikleri, mesajlaşma, Excel ve stüdyo ekibi. Pilates ve PT eğitmenleri ile küçük stüdyolar için.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${APP_NAME} · ${TITLE}`, description: DESCRIPTION, url: PATH, type: "website", locale: "tr_TR" },
};

type Feature = { icon: LucideIcon; title: string; text: string };
/** `wide`: the demo spans the page above the features (the client's page, shown as phones). */
type Group = { id: string; label: string; title: string; lead: string; Demo: () => React.ReactNode; features: Feature[]; wide?: boolean };

const GROUPS: Group[] = [
  {
    id: "profil",
    label: "Profil",
    title: "Profil ve keşfedilme",
    lead: "Instagram'dan gelen danışanı tek linkle karşılayın: sizi tanısın, paketini seçsin, kaydını yapsın.",
    Demo: PublicPageDemo,
    features: [
      { icon: Globe, title: "Kişisel sayfanız", text: "studyomapp.com/adınız: tanıtımınız, fotoğraflarınız, uzmanlık alanlarınız ve iletişim bilgileriniz tek sayfada." },
      { icon: Package, title: "Paketler ve fiyatlar", text: "Peşin, taksitli ya da indirimli fiyatlarınız sayfanızda. Danışan paketini seçip başvurur." },
      { icon: ClipboardList, title: "Online kayıt formu", text: "Soruları siz belirlersiniz. Sağlık soruları danışanın açık rızasıyla sorulur." },
      { icon: Gift, title: "Deneme dersi", text: "İlk kez gelenlere deneme dersi gösterin; aynı numara bir kez alabilir." },
      { icon: UserCheck, title: "Başvuru onayı", text: "Gelen başvuruyu onaylayınca danışan listenize eklenir, kendi sayfasının linki ona gider." },
      { icon: Search, title: "Arama motorlarında", text: "Yayındaki sayfanız Google'a açıktır; şehrinizde pilates ya da PT arayan sizi bulabilir." },
    ],
  },
  {
    id: "danisan",
    label: "Danışanın sayfası",
    title: "Danışanın sayfası",
    lead: "Danışanınız uygulama indirmez, şifre belirlemez. Kendi linkini açar; dersleri, programı, beslenme planı ve gelişimi tek sayfada, sekme sekme.",
    Demo: PortalPhonesDemo,
    wide: true,
    features: [
      { icon: Link2, title: "Kişisel link, şifre yok", text: "Her danışanın kendine ait bir sayfası olur; linki WhatsApp'tan ya da e-postayla gönderirsiniz, tarayıcıda açılır." },
      { icon: CalendarDays, title: "Derslerim", text: "Kalan dersini ve sıradaki derslerini görür; boş saatlerinizden ders alır, kuralınıza göre iptal eder." },
      { icon: Check, title: "“Geliyorum”", text: "Ders yaklaşınca sayfanın en üstünde sorulur; “Geliyorum” ya da “Gelemiyorum” der, cevabı listenize düşer." },
      { icon: Dumbbell, title: "Programım", text: "Günün hareketleri set, tekrar ve ağırlığıyla; video linki varsa izler. Antrenmanı bitirince “Bugün yaptım” der." },
      { icon: PersonStanding, title: "Vücut haritası", text: "Günün çalışan kaslarını ön ve arka figürde görür; harekete dokununca o hareketin kasları büyük açılır." },
      { icon: Salad, title: "Beslenme", text: "Öğün öğün planı ve günlük su, protein, adım hedefleri; isterse yazdırır ya da PDF olarak kaydeder." },
      { icon: TrendingUp, title: "İlerlemem", text: "Ölçümlerinin grafiklerini ve ilk ölçümden bu yana değişimi görür; izin verirseniz kilosunu kendisi girer." },
      { icon: FileText, title: "Ödemeler", text: "Havale bilgilerini ve açıklama kodunu görür, dekontunu yükler. Taksit günü sayfanın en üstünde çıkar." },
      { icon: MessagesSquare, title: "Mesajlar ve bildirimler", text: "Size buradan yazar. Rehberle sayfayı ana ekranına ekler, hangi bildirimleri alacağını kendisi seçer." },
    ],
  },
  {
    id: "randevu",
    label: "Randevu",
    title: "Randevu ve takvim",
    lead: "Kim ne zaman geliyor, kimin dersi iptal oldu, bir bakışta görün.",
    Demo: BookingDemo,
    features: [
      { icon: CalendarClock, title: "Online randevu", text: "Çalışma saatlerinizi girin; danışan boş saatlerden birini kendisi seçer, çakışma olmaz." },
      { icon: CalendarDays, title: "Haftalık takvim", text: "Bütün dersleriniz haftalık görünümde. Her hafta tekrar eden dersi bir kez planlarsınız." },
      { icon: UsersRound, title: "Grup dersleri", text: "Kontenjanı reformer sayınıza göre koyun, düzenli gelenlere sabit yer ayırın." },
      { icon: BellRing, title: "“Geliyor musun?”", text: "Dersten önce danışana hatırlatma gider, ne zaman gideceğini siz seçersiniz. Danışan cevap verir." },
      { icon: ClipboardCheck, title: "Yoklama", text: "Geldi, gelmedi, geç iptal. Yoklamayı aldığınızda kalan seans paketten düşer." },
      { icon: RotateCcw, title: "Geç iptal ve telafi", text: "Ücretsiz iptal süresini 0 ile 48 saat arasında seçin; pakette telafi hakkı varsa önce o kullanılır." },
    ],
  },
  {
    id: "paket",
    label: "Paket ve ödeme",
    title: "Paket ve ödeme",
    lead: "Kalan seans ve kalan ödeme her an güncel; hatırlatmak için telefonu elinize almanız gerekmez.",
    Demo: InstallmentDemo,
    features: [
      { icon: Package, title: "Seans paketleri", text: "Özel, düet ve grup paketleri; ders sayısını ve geçerlilik süresini siz belirlersiniz." },
      { icon: Wallet, title: "Taksit ve hatırlatma", text: "Taksitli satın, taksit gününden bir gün önce danışana hatırlatma gitsin." },
      { icon: FileText, title: "Havale ve dekont", text: "Danışan IBAN'ınıza havale yapıp dekontu yükler, siz onaylarsınız. Açıklama kodu ödemeyi tanımanızı sağlar." },
      { icon: RefreshCw, title: "Paket yenileme", text: "Paket biterken danışana yenileme teklifi gider; aynı paketi tek dokunuşla ister." },
      { icon: CalendarCheck, title: "Bekleyen ödemeler", text: "Kimin ne kadar borcu olduğunu tek listede görün, hazır mesajla hatırlatın." },
      { icon: Percent, title: "Komisyon yok", text: "Para doğrudan sizin hesabınıza gelir; ödemeler bizden geçmez." },
    ],
  },
  {
    id: "antrenman",
    label: "Antrenman ve beslenme",
    title: "Antrenman ve beslenme",
    lead: "Programı yazın, danışanınız telefonunda açsın; hangi kası çalıştırdığını da görsün.",
    Demo: BodyMapDemo,
    features: [
      { icon: Dumbbell, title: "Antrenman programı", text: "Gün gün hareketler; set, tekrar, ağırlık ya da yay ayarı, dinlenme ve not." },
      { icon: ListChecks, title: "200'den fazla hazır hareket", text: "Makine, serbest ağırlık, core, fonksiyonel, reformer, mat ve esneme. Kendi hareketinizi de eklersiniz." },
      { icon: PersonStanding, title: "Vücut haritası", text: "Her harekette ana ve yardımcı kaslar işaretli; danışan günün kaslarını ön ve arka figürde görür." },
      { icon: Copy, title: "Şablonlar", text: "Sık verdiğiniz programı bir kez hazırlayın, her danışana kopyalayıp kişiye göre düzenleyin." },
      { icon: PlayCircle, title: "Video linki", text: "Harekete kendi videonuzun ya da beğendiğiniz bir YouTube, Instagram videosunun linkini ekleyin." },
      { icon: Salad, title: "Beslenme planı", text: "Öğün öğün öneriler; günlük su, protein ve adım hedefi. Planı yazdırın ya da PDF olarak kaydedin." },
    ],
  },
  {
    id: "gelisim",
    label: "Gelişim",
    title: "Gelişim takibi",
    lead: "Ölçümler grafikte, notlar elinizin altında. Danışan da ilerlemesini kendi sayfasında görür.",
    Demo: ProgressDemo,
    features: [
      { icon: Ruler, title: "Vücut ölçümleri", text: "Kilo, kas, yağ oranı, bel, göğüs, kol… Hangi ölçüleri tuttuğunuzu siz seçersiniz, kendi ölçünüzü eklersiniz." },
      { icon: TrendingUp, title: "Gelişim grafikleri", text: "Her ölçünün değişimi grafikte: “3 ayda −2,6 kg”. Danışan aynı grafiği görür." },
      { icon: BellRing, title: "Ölçüm hatırlatması", text: "Danışan başına 2 ile 12 hafta arasında bir sıklık seçin; zamanı gelince Bugün ekranınızda görürsünüz, danışana bildirim gider." },
      { icon: Smartphone, title: "Danışan kilosunu girer", text: "İzin verirseniz danışan kendi sayfasından kilosunu yazar, grafikte “kendisi” diye görünür." },
      { icon: StickyNote, title: "Ders notları", text: "Yoklamayı alırken derse not düşün; isterseniz notu danışanla paylaşın." },
      { icon: AlertTriangle, title: "Uyarı notu", text: "Sakatlık gibi bir uyarı varsa ders listesinde danışanın adının yanında görünür." },
    ],
  },
  {
    id: "iletisim",
    label: "Mesaj ve hatırlatma",
    title: "Mesaj ve hatırlatmalar",
    lead: "Kişisel numaranızı vermeden yazışın; hatırlatmalar sizin cümlelerinizle gitsin.",
    Demo: MessagesDemo,
    features: [
      { icon: MessagesSquare, title: "Mesajlaşma", text: "Danışan kendi sayfasından yazar, siz uygulamadan cevap verirsiniz. İkinizin de telefonuna bildirim düşer." },
      { icon: Bell, title: "Bildirimler", text: "Başvuru, randevu, iptal, havale ve mesaj geldiğinde haber alın; hangilerini istediğinizi seçin." },
      { icon: MessageSquareText, title: "Kendi cümleleriniz", text: "Hatırlatmaların ne zaman gideceğini ve hazır mesajların metnini siz yazarsınız." },
      { icon: Send, title: "WhatsApp da elinizde", text: "Aynı hazır metinle danışana WhatsApp'tan da tek dokunuşla yazarsınız." },
      { icon: CalendarCheck, title: "Haftalık özet", text: "Her pazartesi geçen haftanın dersleri, katılımı ve tahsilatı tek bildirimde." },
      { icon: UserRoundSearch, title: "Bir süredir gelmeyenler", text: "Üç haftadır gelmeyen danışanları bir listede görün, hemen yazın." },
    ],
  },
  {
    id: "ekip",
    label: "Ekip ve stüdyo",
    title: "Ekip ve stüdyo",
    lead: "Birkaç eğitmenli bir stüdyonuz varsa ekibinizi aynı hesaba davet edin. Takvim ortak olur; ödemeler ve fiyatlar sizde kalır.",
    Demo: TeamCalendarDemo,
    features: [
      { icon: UserPlus, title: "E-postayla davet", text: "Ayarlar → Ekip'ten eğitmeni e-postasıyla davet edin, kendi e-postasıyla giriş yapsın. Hem kendi hesabı hem stüdyonuzda dersi olan eğitmen, hesaplar arasında geçiş yapar." },
      { icon: Lock, title: "Kim neyi görür", text: "Eğitmen takvimi, kendi derslerini, yoklamayı, ders notlarını ve programları görür; ödemeleri, fiyatları, paket ve stüdyo ayarlarını görmez. Bütün danışanları mı, yalnızca kendi danışanlarını mı göreceğini siz seçersiniz." },
      { icon: CalendarDays, title: "Renkli ortak takvim", text: "Her dersin ve grup dersinin bir eğitmeni var, her eğitmenin de kendi rengi. Takvimi tek eğitmene göre süzün. Çakışmaya eğitmen bazında bakılır; iki eğitmen aynı saatte ders verebilir." },
      { icon: ArrowRightLeft, title: "Dersi devretme", text: "Bir dersi ya da bütün seriyi başka eğitmene verin. O dersteki danışanlara dersi kimin vereceği bildirilir." },
      { icon: CalendarClock, title: "Eğitmene göre randevu", text: "Her eğitmenin kendi çalışma saatleri ve izin günleri olur. Danışan randevu alırken eğitmen seçer ya da “Fark etmez” der; boş olan eğitmen dersi alır." },
      { icon: Package, title: "Eğitmene özel paket", text: "Bir seans paketini belirli eğitmenlerle sınırlayın; örneğin kıdemli eğitmenin özel dersleri ayrı bir paketle satılsın." },
      { icon: Wallet, title: "Hakediş", text: "Ders türüne göre (özel, düet, trio, grup) ders başına sabit ücret ya da dersin değerinden yüzde. Ayı kapatın, ödendi diye işaretleyin, Excel olarak indirin. Eğitmen yalnızca kendi hakedişini görür." },
      { icon: UsersRound, title: "Sayfanızda ekibiniz", text: "Stüdyo sayfanızda eğitmenler fotoğrafı ve kısa tanıtımıyla yer alır. Danışan kendi sayfasında her dersi kimin vereceğini görür." },
    ],
  },
  {
    id: "veri",
    label: "Verileriniz",
    title: "Verileriniz",
    lead: "Defterden ya da Excel'den dakikalar içinde geçin; verileriniz her zaman sizin.",
    Demo: ImportDemo,
    features: [
      { icon: FileSpreadsheet, title: "Excel'den aktarma", text: "Danışan listenizi Excel ya da CSV olarak yükleyin; kalan seanslar ve borçlar da gelsin." },
      { icon: Download, title: "Excel olarak indirme", text: "Danışanlar, paketler, dersler, ödemeler, ölçümler, notlar ve programlar tek dosyada." },
      { icon: ShieldCheck, title: "KVKK'ya uygun", text: "Aydınlatma metni ve sağlık verileri için açık rıza akışı hazır." },
      { icon: Server, title: "Sunucular AB'de", text: "Veriler Almanya'da (Frankfurt) tutulur, satılmaz, reklam için kullanılmaz." },
      { icon: Lock, title: "Sadece sizin danışanlarınız", text: "Her hesabın danışanları birbirinden ayrı tutulur; bu ayrım doğrudan veritabanında yapılır." },
      { icon: Trash2, title: "Silince silinir", text: "Hesabınızı sildiğinizde danışan kayıtlarınız da kalıcı olarak silinir." },
    ],
  },
];

const FAQ: Faq[] = [
  {
    q: "Bu özelliklerin hepsi ücretsiz mi?",
    a: "Beta süresince evet, hepsi açık ve ücretsiz. Ücretli plana geçmeden en az bir hafta önce haber veririz; beta döneminde kayıt olan eğitmenler, ücretli plana geçildiğinde 6 ay ücretsiz kullanır.",
  },
  {
    q: "Hepsini kullanmak zorunda mıyım?",
    a: "Hayır. Sadece paket ve yoklama takibiyle başlayabilirsiniz. Program, beslenme ya da ölçüm kullanmazsanız danışanın sayfasında o bölümler hiç görünmez.",
  },
  {
    q: "Hem pilates hem PT için uygun mu?",
    a: "Evet. Hareket listesinde salon, reformer ve mat hareketleri bir arada; özel, düet ve grup derslerini aynı yerden takip edersiniz.",
  },
  {
    q: "Stüdyomdaki eğitmenler ödemeleri ve fiyatları görür mü?",
    a: "Hayır. Eğitmen takvimi, kendi derslerini, yoklamayı, ders notlarını ve programları görür. Ödemeler, fiyatlar, paket ve stüdyo ayarları yalnızca stüdyo sahibinde. Hakedişinde de eğitmen yalnızca kendi tutarını görür.",
  },
  {
    q: "Stüdyolar için olmayan ne var?",
    a: "Resepsiyon hesabı, salon ya da reformer planlaması, kartla online tahsilat ve birden fazla şube şu an yok. Ödemeler doğrudan IBAN'ınıza gelir.",
  },
];

export default function FeaturesPage() {
  return (
    <div data-marketing className="min-h-dvh overflow-x-clip bg-canvas">
      <Analytics />
      <Reveal />
      <JsonLd data={pageJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, crumbs: [{ href: PATH, label: "Özellikler" }], faq: FAQ })} />
      <SiteHeader page="ozellikler" />
      <Breadcrumbs items={[{ href: PATH, label: "Özellikler" }]} />

      <main>
        <section aria-labelledby="hero-heading" className="px-4 pt-8 text-center sm:px-6 sm:pt-14">
          <p className="anim-rise eyebrow mb-4">Özellikler</p>
          <h1
            id="hero-heading"
            style={{ "--delay": "80ms" } as React.CSSProperties}
            className="anim-rise mx-auto max-w-4xl text-[2.25rem] leading-[1.06] font-semibold tracking-[-0.035em] text-balance sm:text-6xl"
          >
            Kayıttan programa, randevudan ödemeye
          </h1>
          <p
            style={{ "--delay": "160ms" } as React.CSSProperties}
            className="anim-rise mx-auto mt-5 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg"
          >
            Pilates eğitmenleri, personal trainer&apos;lar ve küçük stüdyolar için {APP_NAME}&apos;un bütün özellikleri, konu konu.
            Beta süresince hepsi ücretsiz.
          </p>
          <div style={{ "--delay": "240ms" } as React.CSSProperties} className="anim-rise mt-7 flex justify-center">
            <Button asChild size="lg">
              <Link href="/giris" data-umami-event="ozellikler-basla" data-umami-event-yer="hero">
                Ücretsiz başlayın
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>

        {/* Section shortcuts, kept in view under the header. */}
        <nav aria-label="Bölümler" className="sticky top-16 z-30 mt-12 border-y border-border/70 bg-canvas/85 backdrop-blur-xl">
          <ol className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 [&::-webkit-scrollbar]:hidden">
            {GROUPS.map((g, i) => (
              <li key={g.id} className="shrink-0">
                <a href={`#${g.id}`} className="flex min-h-10 items-center gap-2 rounded-full bg-card px-4 text-sm font-medium shadow-card hover:bg-muted/60">
                  <span className="text-xs text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  {g.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {GROUPS.map((g, gi) => (
          <section key={g.id} id={g.id} aria-labelledby={`${g.id}-heading`} className="scroll-mt-36 px-4 pt-20 sm:px-6 sm:pt-28">
            {g.wide ? (
              <div className="mx-auto flex max-w-6xl flex-col gap-8">
                <div data-reveal className="max-w-3xl">
                  <p className="mb-3 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-lime text-sm font-semibold text-lime-foreground tabular-nums">
                      {String(gi + 1).padStart(2, "0")}
                    </span>
                    <span className="eyebrow">{g.label}</span>
                  </p>
                  <h2 id={`${g.id}-heading`} className="text-[2rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
                    {g.title}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">{g.lead}</p>
                </div>
                <div aria-hidden data-reveal className={cn(card, "overflow-hidden bg-canvas px-4 py-8 sm:px-8")}>
                  <g.Demo />
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {g.features.map(({ icon: Icon, title, text }, i) => (
                    <li key={title} data-reveal style={stagger(i, 3)} className={cn(card, "hover-lift flex gap-4 p-4 sm:flex-col sm:gap-3 sm:p-5")}>
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
              </div>
            ) : (
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
              <div data-reveal className="flex flex-col gap-5 lg:sticky lg:top-36 lg:self-start">
                <div>
                  <p className="mb-3 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-lime text-sm font-semibold text-lime-foreground tabular-nums">
                      {String(gi + 1).padStart(2, "0")}
                    </span>
                    <span className="eyebrow">{g.label}</span>
                  </p>
                  <h2 id={`${g.id}-heading`} className="text-[2rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
                    {g.title}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">{g.lead}</p>
                </div>
                <div aria-hidden className={cn(card, "flex min-h-64 items-center justify-center bg-canvas p-4 sm:p-5")}>
                  <g.Demo />
                </div>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:self-start">
                {g.features.map(({ icon: Icon, title, text }, i) => (
                  <li key={title} data-reveal style={stagger(i, 2)} className={cn(card, "hover-lift flex gap-4 p-4 sm:flex-col sm:gap-3 sm:p-5")}>
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
            </div>
            )}
          </section>
        ))}

        <FaqSection items={FAQ} />

        <CtaBand page="ozellikler" title="Hepsi beta süresince ücretsiz. Bu akşam kurun, yarın kullanın." text="Kayıt için e-posta adresiniz yeterli." />
      </main>
      <SiteFooter />
    </div>
  );
}
