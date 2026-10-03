// Rehber: short, practical articles for pilates and personal training
// studios. Marketing copy, so it addresses the reader with "siz";
// sample messages to clients use "sen" like the app. Text may contain
// [label](/path) links and **bold**; see <RichText> in the rehber pages.

export type GuideBlock =
  | { t: "p"; text: string }
  | { t: "h2"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  /** A ready-to-copy text: a message or a policy. */
  | { t: "example"; title: string; text: string }
  | { t: "note"; text: string };

export type Guide = {
  slug: string;
  title: string;
  /** Meta description and the card text on /rehber. */
  description: string;
  published: string;
  updated: string;
  minutes: number;
  /** The audience page this article leads to. */
  related: { href: string; label: string };
  body: GuideBlock[];
};

export const GUIDES: Guide[] = [
  {
    slug: "seans-paketi-takibi",
    title: "Seans paketi takibi: Kalan dersleri defter tutmadan izlemek",
    description:
      "Pilates ve PT stüdyoları için seans paketi takibinin kuralları: paket süresi, geç iptal, telafi hakkı, dondurma ve yenileme. Defterde, Excel'de ve uygulamada nasıl yapılır?",
    published: "2026-10-02",
    updated: "2026-10-02",
    minutes: 5,
    related: { href: "/pilates-egitmenleri", label: "Pilates stüdyoları için seans takibi" },
    body: [
      {
        t: "p",
        text: "Danışanınız “Kaç dersim kaldı?” diye sorduğunda cevabı deftere bakmadan verebiliyorsanız paket takibiniz yolunda demektir. Veremiyorsanız sorun genelde defterde değil, kuralların baştan yazılmamasındadır. Bu yazıda bir seans paketinin hangi bilgileri taşıması gerektiğini, bir dersin ne zaman paketten düştüğünü ve yenilemeyi nasıl kaçırmayacağınızı anlatıyoruz.",
      },
      { t: "h2", text: "Bir paketin dört bilgisi" },
      {
        t: "ul",
        items: [
          "**Ders sayısı:** 8, 10, 12… Düet ve grup paketlerini özel ders paketinden ayrı tutun.",
          "**Geçerlilik süresi:** Paketin kaç gün içinde kullanılacağı. 8 derslik paket için 6–8 hafta yaygın bir süredir.",
          "**Ödeme:** Peşin mi, taksitli mi; şu ana kadar ne kadar ödendi.",
          "**Kurallar:** Ücretsiz iptal süresi, geç iptalde ne olacağı ve varsa telafi hakkı.",
        ],
      },
      {
        t: "p",
        text: "Bu dördünü paketi satarken danışanla birlikte netleştirirseniz sonradan çıkan tartışmaların çoğu baştan önlenir.",
      },
      { t: "h2", text: "Bir ders ne zaman paketten düşer?" },
      {
        t: "ul",
        items: [
          "Danışan derse geldiyse düşer.",
          "Ücretsiz iptal süresinden önce haber verdiyse düşmez.",
          "Geç iptal ettiyse ya da haber vermeden gelmediyse düşer. Pakette telafi hakkı varsa önce o kullanılır, ders paketten düşmez.",
          "Dersi siz iptal ettiyseniz düşmez.",
        ],
      },
      {
        t: "p",
        text: "Kuralı nasıl yazacağınızı [ders iptal politikası](/rehber/ders-iptal-politikasi) yazısında örnek metinle anlattık.",
      },
      { t: "h2", text: "Süre dolarsa ya da danışan ara verirse" },
      {
        t: "p",
        text: "Süre dolduğunda kalan derslerin yanıp yanmayacağına baştan karar verin. Yanacaksa danışan bunu paketi alırken bilmeli. Tatil, sakatlık ya da hamilelik gibi durumlar için **dondurma** hakkı tanıyabilirsiniz: paket belli bir süre durur, bitiş tarihi o kadar ileri kayar. Kaç gün ve kaç kez dondurulabileceğini de paketin açıklamasına yazın.",
      },
      { t: "h2", text: "Defter, Excel ya da uygulama" },
      {
        t: "p",
        text: "**Defter** en hızlı başlangıçtır ama kalan dersi her seferinde saymanız gerekir ve ödeme bilgisi başka bir sayfada kalır. **Excel** daha düzenlidir; şu sütunlar yeterli:",
      },
      {
        t: "ul",
        items: [
          "Ad soyad ve telefon",
          "Paket adı, başlangıç ve bitiş tarihi",
          "Toplam ders, kullanılan ders, kalan ders (toplam eksi kullanılan)",
          "Paket fiyatı ve ödenen tutar",
        ],
      },
      {
        t: "p",
        text: "Excel'in zayıf yanı, yoklamayla ayrı tutulmasıdır: dersten sonra tabloyu güncellemeyi unuttuğunuz gün kalan ders yanlış olur. **Uygulamada** yoklamayı aldığınızda ders paketten kendiliğinden düşer; geç iptal ve telafi kuralı da aynı anda işlenir.",
      },
      { t: "h2", text: "Yenilemeyi kaçırmamak" },
      {
        t: "p",
        text: "Paket bittikten sonra hatırlatmak geç kalmaktır; danışan bir hafta ara verince geri dönmesi zorlaşır. Pakette **2 ders kaldığında** ya da bitişe **bir hafta kaldığında** kısa bir mesaj atın:",
      },
      {
        t: "example",
        title: "Paket azaldı mesajı",
        text: "Merhaba Ayşe, paketinde 2 ders kaldı. Aynı paketle devam etmek istersen haber ver, sonraki haftanın saatlerini ayarlayalım.",
      },
      {
        t: "p",
        text: "Farklı durumlar için hazır mesajları [ders hatırlatma mesajı örnekleri](/rehber/ders-hatirlatma-mesaji-ornekleri) yazısında topladık.",
      },
      { t: "h2", text: "Stüdyom'da nasıl işliyor?" },
      {
        t: "p",
        text: "Paketi bir kez tanımlarsınız: ders sayısı, süre, fiyat, telafi hakkı. Yoklamayı aldığınızda ders düşer, geç iptal kuralı kendiliğinden uygulanır, paket azalınca danışanın sayfasında “Paketi yenile” butonu çıkar. Danışan kalan dersini kendi linkinden görür, size sormasına gerek kalmaz. Ayrıntılar [Özellikler](/ozellikler) sayfasında.",
      },
    ],
  },
  {
    slug: "pilates-ozel-ders-fiyati",
    title: "Pilates özel ders ve seans paketi fiyatı nasıl belirlenir?",
    description:
      "Pilates ve PT stüdyoları için ders fiyatı hesaplama yöntemi: bir dersin maliyeti, hedef kazanç, paket indirimi, düet ve grup fiyatı, taksit farkı. Örnek hesapla.",
    published: "2026-10-02",
    updated: "2026-10-02",
    minutes: 6,
    related: { href: "/fiyatlar", label: "Stüdyom fiyatları" },
    body: [
      {
        t: "p",
        text: "Fiyat belirlerken çoğu eğitmen çevresindeki stüdyolara bakar. Bu bir başlangıç noktasıdır ama sizin giderlerinizi ve hedefinizi hesaba katmaz. Aşağıdaki yöntemle önce kendi alt sınırınızı bulun, sonra piyasaya göre ayarlayın.",
      },
      {
        t: "note",
        text: "Örnekteki rakamlar yalnızca hesabı göstermek için. Kendi kira, gider ve ders sayınızı yerine koyun.",
      },
      { t: "h2", text: "1. Bir dersin size maliyeti" },
      {
        t: "p",
        text: "Ders başına doğrudan giderlerinizi ve ayın sabit giderlerini toplayın:",
      },
      {
        t: "ul",
        items: [
          "Salon kirası: saatlik kiralıyorsanız ders başına; aylık kiralıyorsanız aylık kira bölü ayda verdiğiniz ders sayısı",
          "Eğitmen ücreti: dersi ekibinizden bir eğitmen veriyorsa ders başına hakedişi",
          "Ekipman: reformer, mat, küçük aletler; yıllık yıpranma payını aylığa bölün",
          "Yol, telefon, uygulama ve muhasebe giderleri",
          "Vergi ve sosyal güvenlik payı",
        ],
      },
      {
        t: "example",
        title: "Örnek",
        text: "Ayda 80 ders veriyorsunuz. Salonu saatlik 400 TL'ye kiralıyorsunuz. Diğer sabit giderleriniz ayda 6.000 TL.\nDers başı maliyet: 400 + (6.000 ÷ 80) = 475 TL",
      },
      { t: "h2", text: "2. Hedef kazancınızı ekleyin" },
      {
        t: "p",
        text: "Ayda elinizde kalmasını istediğiniz tutarı ders sayısına bölün ve maliyete ekleyin. Hedef 60.000 TL ise ders başına 750 TL eder; ders fiyatınız en az 475 + 750 = **1.225 TL** olmalı. Şahıs şirketiyle çalışıyorsanız fiyatın KDV dahil mi hariç mi olduğuna da karar verin; bu hesabı mali müşavirinizle bir kez yapmanız yeterli.",
      },
      {
        t: "p",
        text: "Ders sayısını iyimser almayın. İptaller, tatiller ve boş saatler yüzünden planladığınızdan daha az ders verirsiniz; hesabı gerçekte verdiğiniz son üç ayın ortalamasıyla yapın.",
      },
      { t: "h2", text: "3. Paket indirimi" },
      {
        t: "p",
        text: "Paket, danışanın düzenli gelmesini sağlar; indirim bunun karşılığıdır. Kademeli bir yapı işinizi kolaylaştırır:",
      },
      {
        t: "ul",
        items: [
          "Tek ders: tam fiyat",
          "8 ders: tek ders fiyatından küçük bir indirim",
          "12 ders ve üzeri: biraz daha fazla indirim, buna karşılık sınırlı geçerlilik süresi",
        ],
      },
      {
        t: "p",
        text: "İndirim büyüdükçe süre sınırı ve iptal kuralı daha önemli hale gelir; yoksa uzun paket, düşük fiyattan aylarca süren bir borca dönüşür.",
      },
      { t: "h2", text: "4. Düet ve grup dersi" },
      {
        t: "p",
        text: "Düette kişi başı fiyat özel dersten düşük, toplam gelir ise yüksek olmalı. Grup dersinde kontenjan reformer sayınızla sınırlıdır; kişi başı fiyatı, ders dolu olmadığında da maliyetinizi karşılayacak şekilde belirleyin. Örneğin 4 kişilik bir grup dersinin en az 3 kişiyle açılmasını kural haline getirebilirsiniz.",
      },
      { t: "h2", text: "5. Taksitli fiyat" },
      {
        t: "p",
        text: "Taksitli satışta paranın bir kısmını geç alırsınız ve takip yükü artar. Bu yüzden taksitli fiyatı peşin fiyattan biraz yüksek tutmak yaygındır. Danışana iki seçeneği yan yana gösterin: “12 ders: peşin 13.500 TL ya da 3 × 4.800 TL” gibi. Peşin indirimi görünür olunca çoğu danışan peşini seçer.",
      },
      { t: "h2", text: "6. Deneme dersi" },
      {
        t: "p",
        text: "Deneme dersi ilk kez gelen danışan içindir ve bir kez verilir. Ücretsiz ya da indirimli olabilir; önemli olan dersin sonunda danışana hangi paketle devam edebileceğini net söylemeniz.",
      },
      { t: "h2", text: "Fiyatı ne zaman güncellemeli?" },
      {
        t: "p",
        text: "Yılda bir ya da iki kez, giderleriniz arttığında güncelleyin. Elindeki paketi bitirmemiş danışanın fiyatı değişmez; yeni fiyat bir sonraki pakette geçerli olur. Değişikliği en az iki hafta önceden haber verin.",
      },
      {
        t: "p",
        text: "Paketlerinizi peşin, taksitli ve indirimli fiyatla Stüdyom'a girip danışanın kendi sayfasından seçmesini sağlayabilirsiniz. Ayrıntılar [pilates stüdyoları](/pilates-egitmenleri) sayfasında.",
      },
    ],
  },
  {
    slug: "ders-iptal-politikasi",
    title: "Ders iptal politikası nasıl yazılır? Örnek metin",
    description:
      "Pilates ve PT dersleri için iptal, geç iptal, gelmeme ve geç kalma kuralları. Danışanınıza gönderebileceğiniz hazır örnek metin ve kuralı uygularken dikkat edilecekler.",
    published: "2026-10-02",
    updated: "2026-10-02",
    minutes: 5,
    related: { href: "/pilates-egitmenleri", label: "Telafi hakkı ve geç iptal" },
    body: [
      {
        t: "p",
        text: "Yazılı bir iptal kuralınız yoksa her son dakika iptali bir pazarlığa döner ve çoğu zaman siz kaybedersiniz. Kural, danışanı cezalandırmak için değil, saatinizin boşa gitmemesi içindir. Aşağıda bir iptal politikasında olması gerekenleri ve doğrudan kullanabileceğiniz bir örnek metni bulacaksınız.",
      },
      { t: "h2", text: "Politikada olması gerekenler" },
      {
        t: "ol",
        items: [
          "**Ücretsiz iptal süresi:** Dersten kaç saat önceye kadar iptal edilirse ders paketten düşmez.",
          "**Geç iptal:** Bu süreden sonra yapılan iptalde ne olur.",
          "**Haber vermeden gelmeme:** Genelde geç iptalle aynı sayılır.",
          "**Geç kalma:** Ders uzatılmaz, kalan süre işlenir.",
          "**Sizin iptaliniz:** Ders paketten düşmez, yeni saat önerilir.",
          "**Telafi hakkı:** Varsa pakette kaç tane olduğu.",
          "**Paket süresi ve dondurma:** Süre dolunca kalan derslerin durumu.",
        ],
      },
      { t: "h2", text: "Kaç saat önce?" },
      {
        t: "p",
        text: "Özel derslerde 12 ya da 24 saat yaygındır. Grup derslerinde yerin başka birine açılabilmesi için süreyi biraz daha uzun tutmak mantıklıdır. Sabah erken dersleriniz varsa saat yerine “bir önceki gün 20:00'ye kadar” gibi bir sınır daha anlaşılır olur.",
      },
      { t: "h2", text: "Örnek metin" },
      {
        t: "p",
        text: "Aşağıdaki metni kendi süre ve kurallarınıza göre düzenleyip paketi satarken danışanınıza gönderebilirsiniz:",
      },
      {
        t: "example",
        title: "İptal ve katılım kuralları",
        text: "Derslerimiz randevuyla ilerliyor, ayırdığın saat yalnızca sana ait.\n\n• Dersini en geç 24 saat önce iptal edersen paketinden düşmez, birlikte yeni bir saat belirleriz.\n• 24 saatten kısa süre kala yapılan iptallerde ve haber vermeden gelinmeyen derslerde ders paketinden düşer.\n• Paketinde 1 telafi hakkın var. İlk geç iptalinde bu hak kullanılır, dersin düşmez.\n• Geç kalırsan dersimiz yine planlanan saatte biter.\n• Dersi ben iptal edersem paketinden düşmez.\n• Paketin, başlangıçtan itibaren 8 hafta geçerli. Sağlık sorunu ya da tatil için paketini bir kez, 2 haftaya kadar dondurabiliriz.",
      },
      { t: "h2", text: "Kuralı uygularken" },
      {
        t: "ul",
        items: [
          "Kuralı ilk pakette yazılı paylaşın ve danışanın okuduğunu teyit edin.",
          "Herkese aynı kuralı uygulayın; tek bir istisna, kuralın pazarlığa açık olduğunu gösterir.",
          "Telafi hakkı kuralı yumuşatır: danışan ilk geç iptalinde ders kaybetmez, kural yine de işler.",
          "Ders öncesi hatırlatma, geç iptallerin çoğunu baştan önler. Örnek mesajlar için [ders hatırlatma mesajı örnekleri](/rehber/ders-hatirlatma-mesaji-ornekleri) yazısına bakın.",
        ],
      },
      { t: "h2", text: "Stüdyom'da nasıl işliyor?" },
      {
        t: "p",
        text: "Ücretsiz iptal süresini 0 ile 48 saat arasında seçersiniz, telafi hakkını paket başına belirlersiniz. Danışan kendi sayfasından iptal ettiğinde süre kontrol edilir; geç iptalde önce telafi hakkı kullanılır, hak yoksa ders paketten düşer. Kalan ders sayısı herkes için aynı kuralla hesaplanır. Ayrıntılar [pilates stüdyoları](/pilates-egitmenleri) sayfasında.",
      },
    ],
  },
  {
    slug: "ders-hatirlatma-mesaji-ornekleri",
    title: "Ders hatırlatma mesajı örnekleri",
    description:
      "Pilates ve PT danışanlarına ders öncesi, paket bitimi, ödeme ve bir süredir gelmeyenler için kısa hatırlatma mesajı örnekleri. Ne zaman ve nasıl gönderilmeli?",
    published: "2026-10-02",
    updated: "2026-10-02",
    minutes: 4,
    related: { href: "/personal-trainer", label: "PT stüdyoları için danışan takibi" },
    body: [
      {
        t: "p",
        text: "Gelmeyen danışanın çoğu dersi unutmuştur, vazgeçmemiştir. Doğru zamanda giden kısa bir mesaj hem boş kalan saati hem de “Haberim yoktu” tartışmasını önler. Aşağıdaki mesajları kopyalayıp kendi üslubunuza göre düzenleyebilirsiniz.",
      },
      { t: "h2", text: "Ne zaman gönderilmeli?" },
      {
        t: "ul",
        items: [
          "**Ders hatırlatması:** Öğleden sonraki dersler için aynı gün sabah, sabah dersleri için bir önceki akşam.",
          "**Paket azaldı:** 2 ders kaldığında ya da bitişe bir hafta kaldığında.",
          "**Ödeme:** Taksit gününden bir gün önce.",
          "**Bir süredir gelmeyen:** Son dersinin üzerinden 2–3 hafta geçtiğinde.",
        ],
      },
      { t: "h2", text: "Ders öncesi" },
      {
        t: "example",
        title: "Onay isteyen hatırlatma",
        text: "Merhaba Zeynep, yarın 10:00'da dersin var. Geliyor musun? Kısaca haber verirsen sevinirim.",
      },
      {
        t: "example",
        title: "Grup dersi",
        text: "Merhaba Can, bu akşam 19:00 reformer grup dersindeki yerin hazır. Gelemeyeceksen 15:00'e kadar haber ver, yerini bekleyen birine açayım.",
      },
      { t: "h2", text: "Paket azaldı ya da bitti" },
      {
        t: "example",
        title: "Paket azaldı",
        text: "Merhaba Elif, paketinde 2 ders kaldı. Devam etmek istersen haber ver, saatlerini koruyalım.",
      },
      {
        t: "example",
        title: "Paket bitti",
        text: "Merhaba Elif, paketindeki dersler bitti. Aynı saatlerle devam etmek istersen yeni paketi hazırlayayım.",
      },
      { t: "h2", text: "Ödeme hatırlatması" },
      {
        t: "example",
        title: "Taksit günü",
        text: "Merhaba Mert, yarın paketinin 2. taksidi var: 4.800 TL. Gönderdiğinde dekontu iletirsen kaydı hemen kapatırım. Teşekkürler!",
      },
      { t: "h2", text: "Bir süredir gelmeyen" },
      {
        t: "example",
        title: "Seni özledik",
        text: "Merhaba Deniz, bir süredir görüşemedik. Bu hafta uygun bir saatin varsa birlikte bakalım; kaldığımız yerden devam ederiz.",
      },
      { t: "h2", text: "Mesajı kısa tutmanın kuralları" },
      {
        t: "ul",
        items: [
          "Danışanın adıyla başlayın; toplu mesaj gibi görünmesin.",
          "Gün ve saati açık yazın: “yarın 10:00”.",
          "Tek bir şey isteyin: geliyor musun, haber ver, dekontu ilet.",
          "Gece geç saatte göndermeyin.",
          "Kampanya ve indirim duyuruları ticari ileti sayılır ve önceden onay gerektirir; ders ve ödeme hatırlatmaları ise verdiğiniz hizmetle ilgili bilgilendirmedir.",
        ],
      },
      { t: "h2", text: "Stüdyom'da nasıl işliyor?" },
      {
        t: "p",
        text: "Ders hatırlatması, seçtiğiniz saatte danışanın telefonuna bildirim olarak kendiliğinden gider; danışan “Geliyorum” ya da “Gelemiyorum” der, siz yoklama listesinde görürsünüz. Paket, ödeme ve gelmeyenler için hazır mesajlar Bugün ekranında tek dokunuşla açılır; hepsinin metnini Ayarlar'dan kendi üslubunuza göre değiştirebilirsiniz. Ayrıntılar [Özellikler](/ozellikler) sayfasında.",
      },
    ],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug) ?? null;

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const guideDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00Z`));
