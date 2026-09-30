import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  Globe,
  Landmark,
  Link2,
  Package,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { GuideVisibilityButton } from "../bugun/guide-buttons";

export const metadata: Metadata = { title: "Yardım" };

type HelpGuide = {
  id: string;
  icon: ReactNode;
  title: string;
  summary: string;
  steps: ReactNode[];
  links: { href: string; label: string }[];
};

function guides(lateCancelHours: number): HelpGuide[] {
  return [
    {
      id: "paket",
      icon: <Package />,
      title: "Paket nasıl satılır, taksit nasıl işler?",
      summary: "Paketi bir kez gir, danışana tek dokunuşla sat.",
      steps: [
        "Paketler'de sattığın paketleri bir kez gir: ders sayısı, geçerlilik süresi ve peşin fiyat. İstersen üstü çizili indirimsiz fiyatı ve taksitli fiyatı da ekle.",
        "Danışanı aç, Paket sat'a dokun, paketi seç ve başlangıç tarihini gir. Paketin son tarihi buna göre belirlenir.",
        "Taksitli satışta toplam tutar 30 gün arayla eşit taksitlere bölünür. Vadesi gelen taksit Bugün'de ve Ödemeler'de bekleyen alacak olarak görünür.",
        "Ödeme aldıkça Ödemeler'den gir; kalan borç kendiliğinden azalır.",
        "Paketi sonradan değiştirirsen daha önce sattığın paketler etkilenmez.",
      ],
      links: [
        { href: "/paketler", label: "Paketler" },
        { href: "/odemeler", label: "Ödemeler" },
      ],
    },
    {
      id: "yoklama",
      icon: <ClipboardCheck />,
      title: lateCancelHours > 0 ? `Yoklama, telafi hakkı ve ${lateCancelHours} saat kuralı` : "Yoklama ve telafi hakkı",
      summary: "Hangi durumda ders paketten düşer, hangisinde düşmez.",
      steps: [
        "Bugün sayfasında her dersin altında, her danışan için Geldi, Gelmedi, Geç iptal ve İptal düğmeleri var. Yanlışlıkla dokunduysan aynı düğmeye bir daha dokun; işaret kalkar.",
        "Geldi ve Gelmedi paketten bir ders düşer. Zamanında yapılan iptal ders düşürmez.",
        lateCancelHours > 0
          ? `Dersten ${lateCancelHours} saatten az önce yapılan iptal Geç iptal sayılır ve ders yanar.`
          : "Şu an geç iptal kuralın yok: danışan ne zaman iptal ederse etsin ders yanmaz. Yine de yoklamada Geç iptal'i elle işaretleyebilirsin.",
        "Paketin telafi hakkı varsa geç iptalde önce bu hak kullanılır ve ders paketten düşmez. Hak bitince geç iptaller paketten düşer.",
        "Danışan kendi sayfasından iptal ederse de aynı kural geçerli; iptal geç sayılacaksa bunu önceden görür.",
        "Süreyi Ayarlar > Geç iptal kuralı'ndan değiştirirsin. Kural istemiyorsan “Kural yok”u seç; iptal her zaman ücretsiz olur.",
      ],
      links: [
        { href: "/bugun", label: "Bugün" },
        { href: "/ayarlar/iptal-kurali", label: "Geç iptal kuralı" },
      ],
    },
    {
      id: "danisan-sayfasi",
      icon: <Link2 />,
      title: "Danışan sayfası",
      summary: "Danışan uygulama indirmeden paketini ve derslerini görür.",
      steps: [
        "Danışanlar'dan danışanı aç, Danışan sayfası kartında Link oluştur'a dokun.",
        "WhatsApp'ta gönder'e dokunup linki danışana yolla ya da kopyalayıp paylaş. Danışanın giriş yapması gerekmez.",
        "Danışan bu linkte kalan ve sıradaki derslerini, ödeme ve taksitlerini görür. Randevu açıksa buradan ders alıp iptal edebilir; havale bildirebilir, yeni paket isteyebilir, sana yazabilir.",
        "Önizle'ye dokunup danışanın gördüğü sayfayı açabilirsin. Linkin en son ne zaman açıldığı kartta yazar.",
        "Link başkasının eline geçtiyse Yenile'ye dokun; eski link çalışmaz olur. Kapat ile linki tamamen kapatırsın.",
      ],
      links: [{ href: "/danisanlar", label: "Danışanlar" }],
    },
    {
      id: "sayfan",
      icon: <Globe />,
      title: "Instagram sayfan ve online kayıt",
      summary: "Bio'daki linkten gelen başvuruları onayla.",
      steps: [
        "Ayarlar > Profil ve sayfan'da fotoğrafını, tanıtımını ve sayfa adresini gir, Sayfayı yayınla'yı aç.",
        "Sayfanın linkini kopyalayıp Instagram bio'na koy. Sayfada göstermeyi seçtiğin paketler orada görünür.",
        "Takipçin bir paket seçip kayıt formunu doldurur. Formdaki soruları Kayıt formu'ndan değiştirebilirsin.",
        "Başvuru Danışanlar > Başvurular'a düşer, Bugün'de de görünür. Cevaplara bak, paketin başlangıç tarihini seç ve Onayla'ya dokun.",
        "Onaylayınca paket danışana tanımlanır ve kendi sayfasında görünür. Onay ekranından danışana WhatsApp'tan haber verebilirsin.",
      ],
      links: [
        { href: "/ayarlar/profil", label: "Profil ve sayfan" },
        { href: "/danisanlar/basvurular", label: "Başvurular" },
      ],
    },
    {
      id: "havale",
      icon: <Landmark />,
      title: "Havale bildirimi ve dekont onayı",
      summary: "Danışan havale yapar, sen hesabına geçince onaylarsın.",
      steps: [
        "Profil ve sayfan'daki Ödeme bilgileri bölümüne IBAN'ını ve hesap sahibinin adını gir. Para doğrudan senin hesabına gelir.",
        "Onayladığın danışan kendi sayfasında IBAN'ı ve açıklamaya yazacağı ödeme kodunu görür.",
        "Danışan havaleyi yapınca Ödemeyi yaptım'a dokunur; isterse dekontunu da ekler.",
        "Bildirim Ödemeler'de onay bekleyen ödemeler arasında görünür. Dekontu aç, para hesabına geçtiyse onayla.",
        "Sen onaylayana kadar borç düşmez. Onaylamazsan nedenini yazabilirsin, danışan bu notu görür.",
      ],
      links: [
        { href: "/odemeler", label: "Ödemeler" },
        { href: "/ayarlar/profil", label: "Ödeme bilgileri" },
      ],
    },
    {
      id: "grup",
      icon: <UsersRound />,
      title: "Grup dersleri",
      summary: "Her hafta aynı saatte, kişi sınırıyla yapılan dersler.",
      steps: [
        "Takvim > Grup dersleri'nde dersi bir kez oluştur: günler, saat, süre ve kapasite.",
        "Katılım şeklini seç: sabit yer (üyenin yeri her hafta ayrılır), tek tek katılım (grup paketi olan danışan istediği derse yazılır) ya da ikisi birden.",
        "Takviminde her zaman önündeki 4 haftanın dersleri görünür; kaç yerin dolu olduğunu da oradan görürsün.",
        "Grup dersleri yalnızca grup paketinden düşer; bu yüzden danışana grup paketi sat.",
        "Sabit üye gelemeyeceği haftayı iptal eder; tek tek katılım açıksa o yere başkası yazılabilir.",
      ],
      links: [{ href: "/takvim/grup", label: "Grup dersleri" }],
    },
    {
      id: "randevu",
      icon: <CalendarClock />,
      title: "Online randevu ve çalışma saatleri",
      summary: "Danışanların boş saatlerine kendileri randevu alsın.",
      steps: [
        "Takvim > Müsaitlik ve randevu'da haftalık çalışma saatlerini gir. Bir günün saatlerini Hafta içine ile diğer günlere kopyalayabilirsin.",
        "Ders süresini, randevunun en az kaç saat önceden alınacağını ve kaç gün ileriye açık olacağını seç.",
        "Danışanlar randevu alabilsin'i aç. Özel ders paketi olan danışanlar boş saatleri kendi sayfalarında görür.",
        "Dersin olan saatler kendiliğinden kapanır. Tatil ve izin günlerini aynı sayfadan ekle.",
      ],
      links: [{ href: "/ayarlar/musaitlik", label: "Müsaitlik ve randevu" }],
    },
    {
      id: "arsiv",
      icon: <ShieldCheck />,
      title: "Danışan arşivleme, silme ve KVKK",
      summary: "Gelmeyi bırakan danışanı arşive al, gerekirse kalıcı olarak sil.",
      steps: [
        "Danışanı aç, kalem simgesine dokun ve en alttaki Arşivle'ye bas. Danışan listelerden kalkar, sıradaki dersleri iptal olur, danışan sayfası kapanır.",
        "Geçmiş dersler ve ödemeler silinmez. Danışanlar sayfasının altındaki Arşivdeki danışanlar'dan danışanı açıp Arşivden çıkar'a dokunabilirsin.",
        "Danışan verilerinin silinmesini isterse önce arşive al, sonra Kalıcı olarak sil'e dokun. Paketleri, dersleri, ödemeleri, dekontları ve form cevapları birlikte silinir; bunu geri alamazsın.",
        "Sağlık bilgileri KVKK'da özel nitelikli veridir: kayıt formunda yalnızca danışan açık rıza verirse sorulur. Rızası olmadan sağlık notu tutma.",
      ],
      links: [
        { href: "/danisanlar/arsiv", label: "Arşiv" },
        { href: "/kvkk", label: "KVKK aydınlatma metni" },
      ],
    },
  ];
}

export default async function HelpPage() {
  const trainer = await withTrainer((tx, trainerId) => getTrainer(tx, trainerId));
  const list = guides(trainer.lateCancelHours);

  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:min-h-0">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader title="Yardım" description="En sık yapılan işler, kısa adımlarla." />

      {trainer.guideDismissedAt && (
        <section aria-label="Başlangıç rehberi" className="mb-6 flex flex-wrap items-center justify-between gap-3 surface px-4 py-3">
          <p className="text-sm">
            <span className="font-medium">Başlangıç rehberi</span>
            <span className="text-muted-foreground"> · Bugün sayfasındaki adım adım liste</span>
          </p>
          <GuideVisibilityButton show size="sm" variant="outline">
            Tekrar göster
          </GuideVisibilityButton>
        </section>
      )}

      <ul className="divide-y overflow-hidden surface">
        {list.map((g) => (
          <li key={g.id} id={g.id} className="scroll-mt-20">
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted [&_svg]:size-[18px]" aria-hidden>
                  {g.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{g.title}</span>
                  <span className="block text-xs text-muted-foreground">{g.summary}</span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="px-4 pb-5 sm:pl-18">
                <ol className="flex flex-col gap-3">
                  {g.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums"
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-4 flex flex-wrap gap-2">
                  {g.links.map((l) => (
                    <Button key={l.href} asChild size="sm" variant="outline">
                      <Link href={l.href}>
                        {l.label}
                        <ArrowRight />
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
