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
      summary: "Paketi bir kez tanımla, danışana tek dokunuşla sat.",
      steps: [
        "Paketler'de sattığın paketleri bir kez tanımla: ders sayısı, geçerlilik süresi ve peşin fiyat. İstersen üstü çizili indirimsiz fiyat ve taksitli fiyat da ekle.",
        "Danışanın sayfasında Paket sat'a dokun, paketi seç ve başlangıç tarihini gir. Son kullanım tarihi buna göre hesaplanır.",
        "Taksitli satışta toplam tutar 30 gün arayla eşit taksitlere bölünür. Vadesi gelen taksit Bugün ve Ödemeler'de bekleyen alacak olarak görünür.",
        "Ödeme aldıkça Ödemeler'den kaydet; kalan borç kendiliğinden düşer.",
        "Paketi sonradan değiştirmen, daha önce satılmış paketleri etkilemez.",
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
        "Bugün'de her dersin altında danışan başına Geldi, Gelmedi, Geç iptal ve İptal düğmeleri var. Yanlış dokunduysan aynı düğmeye tekrar dokun, geri alınır.",
        "Geldi ve Gelmedi paketten bir ders düşer. Zamanında yapılan İptal ders düşürmez.",
        lateCancelHours > 0
          ? `Dersten ${lateCancelHours} saatten az önce yapılan iptal Geç iptal sayılır ve ders yanar.`
          : "Şu an geç iptal kuralın yok: danışan ne zaman iptal ederse etsin ders yanmaz. Yine de yoklamada Geç iptal'i elle işaretleyebilirsin.",
        "Paketin telafi hakkı varsa geç iptalde önce bu hak kullanılır ve ders paketten düşmez. Hak bitince geç iptaller paketten düşer.",
        "Danışan kendi sayfasından iptal ederse aynı kural otomatik uygulanır; geç iptalse ona önceden söylenir.",
        "Süreyi Ayarlar'daki Geç iptal kuralı sayfasından değiştirebilirsin; kural koymak istemezsen iptali her zaman ücretsiz yapabilirsin.",
      ],
      links: [
        { href: "/bugun", label: "Bugün" },
        { href: "/ayarlar/iptal-kurali", label: "Geç iptal kuralı" },
      ],
    },
    {
      id: "danisan-sayfasi",
      icon: <Link2 />,
      title: "Danışanın kişisel sayfası",
      summary: "Danışan uygulama indirmeden paketini ve derslerini görür.",
      steps: [
        "Danışanın sayfasını aç ve Danışan sayfası kartında Link oluştur'a dokun.",
        "WhatsApp'ta gönder ile linki doğrudan danışana yolla ya da kopyalayıp paylaş. Giriş yapmasına gerek yok.",
        "Danışan bu linkte kalan dersini, sıradaki derslerini ve ödeme ya da taksit durumunu görür. Randevu açıksa ders alıp iptal edebilir, havale bildirebilir, yeni paket isteyebilir.",
        "Önizle ile danışanın gördüğünü sen de görürsün. Kartta linkin en son ne zaman açıldığı yazar.",
        "Link başkasına geçtiyse Yenile ile yenisini oluştur; eskisi çalışmaz. Kapat ile tamamen kapatabilirsin.",
      ],
      links: [{ href: "/danisanlar", label: "Danışanlar" }],
    },
    {
      id: "sayfan",
      icon: <Globe />,
      title: "Instagram sayfan ve online kayıt",
      summary: "Bio'daki linkten gelen başvuruları onayla.",
      steps: [
        "Ayarlar > Profil ve sayfam'da fotoğrafını, tanıtımını ve sayfa adresini gir, Sayfam yayında'yı aç.",
        "Sayfanın linkini kopyalayıp Instagram bio'na koy. Sayfanda herkese açık paketlerin görünür.",
        "Takipçin bir paket seçip kayıt formunu doldurur. Formdaki soruları Kayıt formu'ndan değiştirebilirsin.",
        "Başvuru Danışanlar > Başvurular'a düşer ve Bugün'de bildirim çıkar. Cevaplara bakıp paket başlangıç tarihini seç ve Onayla.",
        "Onaylayınca paket danışana tanımlanır ve kişisel sayfasında görünür. Onay ekranından danışana WhatsApp'tan haber ver.",
      ],
      links: [
        { href: "/ayarlar/profil", label: "Profil ve sayfam" },
        { href: "/danisanlar/basvurular", label: "Başvurular" },
      ],
    },
    {
      id: "havale",
      icon: <Landmark />,
      title: "Havale bildirimi ve dekont onayı",
      summary: "Danışan havale yapar, sen hesabına geçince onaylarsın.",
      steps: [
        "Profil ve sayfam'daki Ödeme bilgileri'ne IBAN'ını ve alıcı adını gir. Para doğrudan senin hesabına gelir.",
        "Onayladığın danışan kendi sayfasında IBAN'ı ve açıklamaya yazacağı ödeme kodunu görür.",
        "Danışan havaleyi yapınca Ödemeyi yaptım'a dokunur; istersen dekontunu da ekler.",
        "Bildirim Ödemeler'de onay bekleyen ödemeler arasında görünür. Dekontu aç, para hesabına geçtiyse onayla.",
        "Onaylanana kadar borç düşmez. Onaylamazsan nedenini yazabilirsin; danışan görür.",
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
      summary: "Kapasiteli, her hafta tekrarlayan dersler.",
      steps: [
        "Takvim > Grup dersleri'nde dersi bir kez oluştur: günler, saat, süre ve kapasite.",
        "Katılım şeklini seç: sabit yer (üyenin yeri her hafta ayrılır), tek tek katılım (grup paketi olan danışan istediği derse yer ayırır) ya da ikisi birden.",
        "Dersler 4 hafta ileriye kadar takvimine eklenir, sonrası kendiliğinden devam eder. Doluluk takvimde görünür.",
        "Grup dersleri sadece grup paketlerinden düşer; danışana grup paketi sat.",
        "Sabit üyenin gelemeyeceği haftada yeri iptal edilir; tek tek katılım açıksa o yere başkası katılabilir.",
      ],
      links: [{ href: "/takvim/grup", label: "Grup dersleri" }],
    },
    {
      id: "randevu",
      icon: <CalendarClock />,
      title: "Randevu (müsaitlik) ayarları",
      summary: "Danışanlar boş saatlerinden kendileri ders alsın.",
      steps: [
        "Ayarlar > Müsaitlik ve randevu'da haftalık çalışma saatlerini gir. Bir günü Hafta içine ile diğer günlere kopyalayabilirsin.",
        "Ders süresini, en az kaç saat önceden ve kaç gün ileriye randevu alınabileceğini seç.",
        "Danışanlar randevu alabilsin'i aç. Birebir paketi olan danışanlar kendi sayfalarından boş saatleri görür.",
        "Zaten dersin olan saatler otomatik kapanır. Tatil ya da izin günlerini aynı sayfadan ekle.",
      ],
      links: [{ href: "/ayarlar/musaitlik", label: "Müsaitlik ve randevu" }],
    },
    {
      id: "arsiv",
      icon: <ShieldCheck />,
      title: "Danışan arşivleme, silme ve KVKK",
      summary: "Artık gelmeyen danışanı arşivle; gerekirse kalıcı sil.",
      steps: [
        "Danışanın sayfasında düzenle'ye gir ve Arşivle'ye dokun. Listelerden kalkar, sıradaki dersleri iptal edilir, kişisel sayfa linki kapanır.",
        "Geçmiş dersler ve ödemeler saklanır. Danışanlar > Arşiv'den istediğin zaman geri alabilirsin.",
        "Danışan verilerinin silinmesini isterse önce arşivle, sonra Kalıcı olarak sil. Paketleri, dersleri, ödemeleri, dekontları ve form cevapları birlikte silinir; geri alınamaz.",
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
      <PageHeader title="Yardım" description="Uygulamanın ana akışları, kısa adımlarla." />

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
