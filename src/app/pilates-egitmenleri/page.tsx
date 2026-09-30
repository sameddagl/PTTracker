import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellRing, CalendarClock, Check, Gift, Minus, Package, RotateCcw, UsersRound } from "lucide-react";
import { Analytics } from "@/components/analytics";
import { AttendanceDemo, GroupDemo } from "@/components/landing/feature-demos";
import { Breadcrumbs, CtaBand, FaqSection, JsonLd, SectionHeading, SiteFooter, SiteHeader, card, pageJsonLd, type Faq } from "@/components/landing/site-chrome";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

const PATH = "/pilates-egitmenleri";
const TITLE = "Pilates Eğitmenleri İçin Seans Paketi ve Yoklama Takibi";
const DESCRIPTION =
  "Reformer ve mat pilates eğitmenleri için seans paketi, yoklama, telafi hakkı, grup dersi kontenjanı ve randevu takibi. Danışanlar uygulama indirmez. Beta süresince ücretsiz.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: `${TITLE} · ${APP_NAME}`, description: DESCRIPTION, url: PATH, type: "website", locale: "tr_TR" },
};

const FEATURES = [
  {
    icon: Package,
    title: "Özel, düet ve grup paketleri",
    text: "8 derslik düet, 12 derslik özel reformer… Paketin kaç ders olduğunu ve kaç gün geçerli kalacağını siz belirlersiniz. Peşin, taksitli ya da indirimli fiyat girebilirsiniz.",
  },
  {
    icon: RotateCcw,
    title: "Telafi hakkı ve geç iptal",
    text: "Ücretsiz iptal süresini 0 ile 48 saat arasında siz seçersiniz. Süre geçtikten sonra iptal edilen ders paketten düşer; pakette telafi hakkı varsa önce o kullanılır.",
  },
  {
    icon: UsersRound,
    title: "Reformer kontenjanı ve sabit yer",
    text: "Grup dersinde kaç reformer varsa kontenjanı ona göre koyun. Düzenli gelenlere sabit yer ayırın, boş kalan yerlere diğer danışanlar kendi sayfasından yazılsın.",
  },
  {
    icon: CalendarClock,
    title: "Danışan randevusunu kendi alır",
    text: "Çalışma saatlerinizi girin; danışan boş saatlerden birini seçer. Çakışan ders olmaz, iptal kuralınız randevuda da geçerli.",
  },
  {
    icon: BellRing,
    title: "Dersten önce “Geliyor musun?”",
    text: "Dersten 36 saat önce danışana hatırlatma gider. “Geliyorum” derse yoklama listenizde görürsünüz; gelemeyecekse yerini başkasına açarsınız.",
  },
  {
    icon: Gift,
    title: "Deneme dersi",
    text: "Sayfanızda ilk kez gelenlere deneme dersi gösterin. Aynı telefon numarası deneme dersini bir kez alabilir.",
  },
];

// Honest checklist: what a pilates instructor usually looks for, and whether we have it.
const CHECKLIST: { item: string; ours: string; has: boolean }[] = [
  { item: "Kalan seans takibi", ours: "Yoklamayı aldığınızda paketten düşer", has: true },
  { item: "Telafi hakkı", ours: "Paket başına siz belirlersiniz", has: true },
  { item: "Geç iptal kuralı", ours: "0 ile 48 saat arasında", has: true },
  { item: "Grup dersi kontenjanı ve sabit yer", ours: "Var; takvim 4 hafta ileriye hazır", has: true },
  { item: "Danışanın kendi randevusunu alması", ours: "Çalışma saatlerinize göre", has: true },
  { item: "Taksitli paket ve ödeme takibi", ours: "Danışan havaleyi ve dekontu kendisi bildirir", has: true },
  { item: "Sağlık formu ve açık rıza", ours: "Kayıt formunda, KVKK'ya uygun onayla", has: true },
  { item: "Excel'den danışan aktarma", ours: "Kalan seans ve borçlarla birlikte", has: true },
  { item: "Danışan için uygulama", ours: "Gerekmez; kişisel link tarayıcıda açılır", has: true },
  { item: "Birden fazla eğitmen, ortak takvim", ours: "Şimdilik yok", has: false },
  { item: "Kartla online tahsilat", ours: "Yok; ödeme doğrudan IBAN'ınıza gelir", has: false },
];

const FAQ: Faq[] = [
  {
    q: "Reformer sayısına göre kontenjan koyabilir miyim?",
    a: "Evet. Her grup dersi için kontenjanı ayrı girersiniz. Dolu derse yeni danışan yazılamaz; sabit yeri olan danışanların yeri her hafta kendiliğinden ayrılır.",
  },
  {
    q: "Telafi hakkı nasıl işliyor?",
    a: "Pakete kaç telafi hakkı tanıdığınızı siz yazarsınız. Danışan geç iptal ettiğinde önce telafi hakkı kullanılır, ders paketten düşmez. Hak bitince geç iptaller paketten düşer.",
  },
  {
    q: "Bir stüdyoda saatlik salon kiralıyorum, kullanabilir miyim?",
    a: `Evet. ${APP_NAME} tek başına ders veren eğitmen için: kendi stüdyonuz da olabilir, kiraladığınız salon ya da danışanın evi de. Birden fazla eğitmenin aynı takvimi paylaştığı stüdyo hesabı şu an yok.`,
  },
  {
    q: "Danışanım uygulama indirmek zorunda mı?",
    a: "Hayır. Her danışanın kişisel bir linki olur, tarayıcıda açılır. İsteyen sayfayı telefonunun ana ekranına ekler; ders hatırlatmaları ve mesajlarınız bildirim olarak gelir.",
  },
  {
    q: "Paket bitince ne oluyor?",
    a: "Pakette 2 ders kaldığında ya da son tarihe 7 gün kaldığında danışanın sayfasında “Paketi yenile” butonu çıkar. Danışan aynı paketi tek tıkla ister, siz onaylarsınız.",
  },
  {
    q: "Danışanlarımın sağlık bilgilerini nasıl alırım?",
    a: "Kayıt formunda sakatlık, hamilelik gibi soruları siz belirlersiniz. Bu sorular danışan açık rıza verirse gösterilir ve saklanır; rıza vermeyen danışan o bölümü atlar.",
  },
];

export default function PilatesPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-canvas">
      <Analytics />
      <JsonLd data={pageJsonLd({ path: PATH, title: TITLE, description: DESCRIPTION, crumbs: [{ href: PATH, label: "Pilates eğitmenleri" }], faq: FAQ })} />
      <SiteHeader page="pilates" />
      <Breadcrumbs items={[{ href: PATH, label: "Pilates eğitmenleri" }]} />

      <main>
        <section aria-labelledby="hero-heading" className="px-4 pt-8 sm:px-6 sm:pt-14">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="eyebrow mb-4">Pilates eğitmenleri için</p>
              <h1 id="hero-heading" className="text-[2.25rem] leading-[1.06] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
                Pilates eğitmenleri için seans paketi, yoklama ve randevu takibi
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
                Reformer, mat, düet ya da grup dersi fark etmez. Yoklamayı aldığınızda kalan seans paketten düşer; telafi hakkı,
                geç iptal ve paket yenileme kendiliğinden işlenir.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/giris" data-umami-event="pilates-basla" data-umami-event-yer="hero">
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
              <AttendanceDemo />
              <GroupDemo />
            </div>
          </div>
        </section>

        <section aria-labelledby="who-heading" className="px-4 pt-20 sm:px-6 sm:pt-28">
          <div className={cn(card, "mx-auto max-w-5xl p-6 sm:p-10")}>
            <h2 id="who-heading" className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Kimler için?
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
              Tek başına ders veren pilates eğitmenleri için: kendi stüdyosu olan, bir stüdyoda saatlik salon kiralayan ya da
              danışanının evine giden. Danışanlarınızı, paketlerini ve ödemelerini kendiniz takip ediyorsanız {APP_NAME} tam size
              göre. Birden fazla eğitmenin aynı takvimi paylaştığı stüdyo hesabı şu an yok.
            </p>
          </div>
        </section>

        <section aria-labelledby="features-heading" className="px-4 pt-20 sm:px-6 sm:pt-28">
          <SectionHeading
            id="features-heading"
            eyebrow="Pilates'e göre ayarlı"
            lead="Stüdyoda işler nasıl yürüyorsa öyle."
            rest="Paket, telafi, iptal kuralı ve reformer kontenjanı hazır."
          />
          <ul className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className={cn(card, "flex flex-col gap-3 p-6")}>
                <span className="flex size-10 items-center justify-center rounded-full bg-lime text-lime-foreground" aria-hidden>
                  <Icon className="size-5" />
                </span>
                <h3 className="text-lg font-semibold tracking-[-0.02em]">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="checklist-heading" className="px-4 pt-20 sm:px-6 sm:pt-28">
          <SectionHeading
            id="checklist-heading"
            eyebrow="Karşılaştırırken"
            lead="Bir pilates programında bakmanız gerekenler."
            rest="Olmayanları da yazdık."
          />
          <div className={cn(card, "mx-auto mt-12 max-w-4xl overflow-hidden")}>
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium sm:px-7">
                    Özellik
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium sm:px-7">
                    {APP_NAME}&apos;da
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {CHECKLIST.map((r) => (
                  <tr key={r.item}>
                    <th scope="row" className="px-5 py-4 align-top font-medium sm:px-7">
                      {r.item}
                    </th>
                    <td className="px-5 py-4 text-muted-foreground sm:px-7">
                      <span className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                            r.has ? "bg-success/15 text-success-strong" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {r.has ? <Check className="size-3" strokeWidth={3} aria-label="Var" /> : <Minus className="size-3" aria-label="Yok" />}
                        </span>
                        {r.ours}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="why-heading" className="px-4 pt-20 sm:px-6 sm:pt-28">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
            <div className={cn(card, "p-6 sm:p-8")}>
              <h2 id="why-heading" className="text-xl font-semibold tracking-[-0.02em]">
                Genel bir randevu programı neden yetmez?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Randevu programları saati tutar, ama paketin kaçıncı dersinde olduğunu, geç iptalin paketten düşüp düşmeyeceğini ya
                da taksitin ödenip ödenmediğini bilmez. Pilateste asıl iş bu hesaplarda. {APP_NAME} yoklamayı pakete, paketi ödemeye
                bağlar; hangi danışanın kaç dersi ve ne kadar borcu kaldığını tek ekranda görürsünüz.
              </p>
            </div>
            <div className={cn(card, "p-6 sm:p-8")}>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">Excel ya da defterden geçiş</h2>
              <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                <li>Danışan listenizi Excel ya da CSV olarak yükleyin.</li>
                <li>Sütunları eşleştirin: ad, telefon, kalan seans, paket bitişi, borç.</li>
                <li>Önizlemeye bakıp aktarın. Aynı telefon numarası iki kez eklenmez.</li>
              </ol>
              <p className="mt-3 text-sm text-muted-foreground">
                Bütün verilerinizi istediğiniz an Excel olarak geri indirebilirsiniz.
              </p>
            </div>
          </div>
        </section>

        <FaqSection items={FAQ} />

        <CtaBand
          page="pilates"
          title="Bu akşam paketlerinizi girin, yarın yoklamayı telefondan alın."
          text="Beta süresince ücretsiz, kart bilgisi istemiyoruz."
        />
      </main>
      <SiteFooter />
    </div>
  );
}
