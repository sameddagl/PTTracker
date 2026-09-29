# Stüdyom — Öne Çıkaracak Özellikler ve Faz 1 Yol Haritası

> Hazırlanma: 30 Eylül 2026
> Dayanak: [PAZAR_ARASTIRMASI.md](../PAZAR_ARASTIRMASI.md), koddaki mevcut durum (`src/app`, `src/db`) ve rakip siteleri, inceleme platformları ile Şikayetvar üzerinde yapılan yeni tarama.
> Fiyatlar ve özellik listeleri rakiplerin kendi sayfalarından alındı. Değişmiş olabilir. Rakip bloglarından (ör. Vibefam) gelen yorumlar taraflı olabilir, metinde bunlar ayrıca belirtildi.

---

## 1. Kısa özet: bizi farklı kılacak şey

1. **Danışan uygulama indirmez, şifre de hatırlamaz.** Rakiplerin neredeyse hepsi (GymKod, Plan4M, piSEANS, NetFit) danışana bir mobil uygulama kurduruyor. Bizde her şey WhatsApp'tan gelen tek bir linkte duruyor. Bu avantajı her yeni özellikte korumalıyız: onay, bekleme listesi, yenileme, deneme dersi, hepsi aynı linkten yürümeli.
2. **"Boş kalan reformer" sorununu çözen tek akış.** Ders öncesi "geliyor musun?" onayı, bekleme listesi ve boşalan yerin otomatik teklif edilmesi birbirine bağlı tek bir akış olacak. Rakipler bunları ayrı ayrı ve çoğu zaman SMS paketiyle satıyor.
3. **WhatsApp'la birlikte çalışan, WhatsApp'ı taklit etmeyen otomasyon.** Şirket ve Meta onayı olmadan, sıfır maliyetle: sabah eğitmene "yarının listesi" gelir, tek dokunuşla her danışana hazır mesaj gider, cevaplar portal linkinden sisteme geri akar. API geldiğinde aynı akış kendiliğinden otomatik hale gelir.
4. **Türkiye'nin ödeme alışkanlığına göre kurulmuş para tarafı.** Nakit ve taksit fiyatı, IBAN'a havale ve dekont yükleme, borçlu listesi, WhatsApp'tan ödeme hatırlatması. Bunların hepsi şu an çalışıyor. Kart ile ödemeyi ancak şirket kurulunca, üstüne koyarak ekleyeceğiz.
5. **Instagram'dan gelen adayı danışana çeviren yol.** Bio linkindeki sayfa, başvuru, onay ve paket zaten var. Eksik halka **deneme dersi**: aday takvimden boş bir saat seçer, eğitmen tek dokunuşla onaylar.
6. **Paketi adil yöneten kurallar.** 24 saat kuralı ve telafi hakkı var. Bunlara **dondurma** eklenince Şikayetvar'daki en yaygın öfke konusu olan "dersim yandı, dondurmadılar" durumuna eğitmen tarafında bir araç sunmuş oluruz.
7. **Sade kalmak da bir özellik.** Komisyon, oda, turnike, çok şube, antrenman programı editörü yok. Solo eğitmenin bir günü neyse ürün de o kadar.

---

## 2. Şu an zaten güçlü olduğumuz alanlar

Aşağıdaki tespitler koddan doğrulandı. Kıyaslar, rakiplerin kendi sitelerinde anlattıklarına dayanıyor.

| Alan | Bizde durum | Rakiplerde | Değerlendirme |
|---|---|---|---|
| **Danışan portalı (link ile)** | `/p/<token>`: kalan ders, taksit planı, IBAN ile ödeme bildirimi ve dekont yükleme, özel ders rezervasyonu ve grup dersine katılım tek gün şeridinde, yeni paket talebi. Giriş yok. | GymKod, Plan4M ve piSEANS danışana mobil uygulama kurduruyor. PilatesYap ve merkezim web tabanlı ama rezervasyon odaklı. | **Gerçek farklılaştırıcı.** Önceki araştırmadaki "müşteriler bir uygulama daha indirmek istemiyor" şikayetine doğrudan cevap veriyor. |
| **Havale ve dekont akışı** | Danışan "ödedim" der, dekontu yükler, eğitmen onaylar ya da reddeder. Borç otomatik güncellenir. | Global araçlar kart odaklı (Stripe). Yerel araçlarda "ödeme takibi" var ama danışan tarafından bildirim ve dekont yükleme öne çıkarılmıyor. | Türkiye'ye özgü ve güçlü. Pazarlamada öne çıkarılmalı. |
| **Nakit ve taksit fiyatı, indirimli fiyat** | `price`, `installmentPrice` ve `installments`, `compareAtPrice`. Taksit planıyla paket satışı. | merkezim taksit takibini listeliyor. piSEANS'ın taksit takibi önceki araştırmada not edilmişti. Global araçlarda bu kavram yok. | Rakipte de var ama bizde paket şablonuna gömülü ve public sayfada da görünüyor. İyi. |
| **Yoklama kuralları** | Geldi, gelmedi, geç iptal, iptal. Telafi hakkı ve eğitmenin ayarladığı iptal saati (varsayılan 24). Bakiye yoklamadan türetiliyor, ayrıca sayaç tutulmuyor. | Momence ve GymKod'da telafi kredisi var. Global araçlarda "yanlış kredi" şikayetleri önceki araştırmada belgelendi. | Doğru mimari. "Kalan ders yanlış" hatasının kaynağını baştan kurutuyor. |
| **Public sayfa ve başvuru** | `/<slug>`: paketler, online kayıt, eğitmen onayı, e-posta bildirimi. | NetFit bunu 690 TL'lik "Pazarlama" planında satıyor. Diğer yerel araçlarda eğitmene özel vitrin sayfası yok ya da stüdyo sitesi olarak kurgulanmış. | Güçlü. Deneme dersiyle tamamlanırsa Instagram hunisi kapanmış olur. |
| **Kayıt formu ve sağlık rızası** | Eğitmenin tanımladığı alanlar ve birimler, açık rıza kaydı, düzenlenebilir cevaplar. KVKK metni ve açık rıza sayfaları. | piSEANS ve PilatesYap KVKK uyumunu vurguluyor. merkezim telefonla dijital onam sunuyor. | Rakiplerle eşit, altında değiliz. Metnin hukuki incelemesi hâlâ gerekiyor. |
| **Grup dersleri** | Kapasite, sabit yer, tek seferlik katılım, 4 hafta ileriye otomatik ders üretimi. Grup dersi yalnızca grup paketinden düşer. | BulutGym, Gymtekno ve Plan4M'de kapasite ve rezervasyon var. | Eşit. **Bekleme listesi eksik** ve bu eksik hemen fark ediliyor. |

**Dürüst zayıf noktalar**

- **Danışana otomatik hatırlatma yok.** piSEANS WhatsApp hatırlatması, Gymtekno SMS ve bildirim, PilatesYap e-posta ve uygulama içi bildirim, merkezim SMS ve WhatsApp sunuyor. Bizde yalnızca eğitmenin eliyle gönderdiği `wa.me` linkleri var. **En büyük açığımız bu.**
- **Zamanlanmış iş (cron) altyapısı yok.** Otomatik olacak her şey (hatırlatma, bekleme listesi teklifi, haftalık özet) önce buna ihtiyaç duyuyor.
- **Veri dışa aktarma yok**, Excel'den içe aktarma da yok. Önceki araştırmada ikisi de V1'e yazılmıştı ve "şeffaflık" vaadimizin parçası.
- **Dondurma için tablo var (`package_freezes`) ve bakiye view'ı bunu hesaba katıyor, ama arayüz yok.**
- **Ölçüm ve gelişim takibi yok.** GymKod, BulutGym ve Gymtekno'da var. Farklılaştırıcı değil ama eksikliği satışta sorulacak.
- **Rapor yok.** Ödemeler sayfasındaki aylık tahsilat dışında doluluk ya da danışan kaybı görünmüyor. Plan4M günlük, haftalık ve aylık rapor satıyor, merkezim 23 hazır rapor listeliyor.

---

## 3. Faz 1 için önerilen farklılaştırıcı özellikler

Efor ölçeği: **S** = 1–2 gün, **M** = yaklaşık 1 hafta, **L** = 2 hafta ve üzeri (tek geliştirici için).

### 3.1 Ders öncesi onay: "Yarın geliyor musun?"

- **Ne:** Eğitmen her sabah (ya da dersten 36 saat önce) Bugün ekranında "Yarının onay listesi" görür. Her danışanın yanında hazır bir WhatsApp mesajı vardır: *"Merhaba Ayşe, yarın 10:00 dersimiz var. Geliyor musun? [link]"*. Danışan linke dokunduğunda portalda **Geliyorum / Gelemiyorum** butonlarını görür. "Gelemiyorum" derse iptal kuralı otomatik uygulanır: 24 saatten önceyse zamanında iptal olur, sonraysa danışana "geç iptal sayılacak, telafi hakkın var/yok" uyarısı gösterilir. Bu mantık portaldaki `cancelBooking` içinde (`confirmLate`) zaten var. Cevaplar eğitmenin takviminde yeşil tik ya da kırmızı çarpı olarak görünür. Danışanın e-postası varsa aynı soru e-postayla da otomatik gider.
- **Neden fark yaratır:** Rakiplerin hatırlatması tek yönlü: "Dersiniz var." Cevabı yoklamaya bağlayan ve iptal kuralını o anda uygulayan akış yerel rakiplerin sayfalarında yok. WhatsApp mesajı eğitmenin kendi numarasından gittiği için danışana "sistem mesajı" gibi değil, hocasından gelen bir mesaj gibi görünür. Solo eğitmen için bu önemli. Maliyet sıfır, şirket gerekmez.
- **Efor:** M. Onay durumu için bir alan, portal butonları, Bugün listesi, e-posta ve cron.
- **Bağımlılık:** Zamanlanmış iş (Vercel Cron ya da Supabase `pg_cron`). WhatsApp Cloud API ile tam otomasyon sonra gelecek. Meta'nın Türkiye utility şablon fiyatı mesaj başına yaklaşık 0,0009 $ ve 1 Ekim 2026'dan itibaren 24 saat penceresindeki utility şablonlar da ücretli ([Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing), [EngageLab](https://www.engagelab.com/blog/whatsapp-business-api-pricing)). Maliyet düşük, asıl engel işletme doğrulaması.
- **Öncelik: Önce yap.** En büyük açığımızı kapatır ve 3.2'nin ön koşuludur.

### 3.2 Bekleme listesi ve "boşalan yeri doldur"

- **Ne:** Grup dersi dolduğunda portalda "Katıl" yerine "Bekleme listesine yazıl" görünür. Biri iptal ettiğinde (3.1'deki "Gelemiyorum" dahil) sistem sıradaki kişiye e-posta gönderir, eğitmenin Bugün ekranına da "Salı 19:00'da 1 yer açıldı, Zeynep sırada" kartı düşer ve kart hazır WhatsApp mesajıyla gelir. Teklif belli bir süre (ör. 2 saat) açık kalır, sonra sıradakine geçer. Dersin başlamasına az kaldıysa "ilk tıklayan alır" moduna geçer.
- **Neden fark yaratır:** Reformer sayısı sabit. Boş kalan her yer eğitmen için doğrudan kayıp. Momence ve Glofox'ta otomatik terfi var, ama Glofox'ta bekleme listesinden otomatik aktarımın çalışmadığına dair kullanıcı şikayetleri, Arketa'da da bekleme listesi hatalarıyla ilgili iddialar var ([Vibefam – Glofox](https://vibefam.com/glofox-reviews-reddit-2026/), [Vibefam – Arketa](https://vibefam.com/arketa-review-pricing-features-pros-cons-2026/); ikisi de rakip kaynak). İncelediğimiz yerel ürünlerin (GymKod, Plan4M, BulutGym) sayfalarında bekleme listesi anılmıyor. Kural basit: kimse habersiz yerinden olmaz, onaylanan yer bekleme listesine düşmez.
- **Efor:** M.
- **Bağımlılık:** Cron (3.1 ile aynı). Özel derste bekleme listesi yerine 3.6'daki "boş saat" duyurusu yeterli.
- **Öncelik: Önce yap.**

### 3.3 Paket dondurma (tatil, sakatlık, rapor)

- **Ne:** Danışan detayında "Paketi dondur": tarih aralığı, neden (tatil / sakatlık / doktor raporu / diğer), isteğe bağlı rapor dosyası. Son kullanım tarihi otomatik uzar. Aralıktaki dersler iptal edilir ve paketten düşmez. Paket şablonunda "dondurma hakkı: 1 kez, en fazla 14 gün" gibi bir kural tanımlanabilir. Portalda danışan dondurma *talep eder*, eğitmen onaylar.
- **Neden fark yaratır:** Şikayetvar'da pilates stüdyolarına yönelik şikayetlerin önemli bir kısmı "dondurmadılar, dersim yandı" üzerine ([örnek: aile acil durumunda dondurma reddi](https://www.sikayetvar.com/body-control-studio/body-control-studio-kayit-iptaldondurma-hakkinda), [Şikayetvar pilates listesi](https://www.sikayetvar.com/pilates)). Solo eğitmen çoğu zaman esnemek ister ama kaydını tutamaz. BulutGym dondurmayı listeliyor. Bizde tablo ve bakiye hesabı hazır, yalnızca arayüz eksik. En ucuz kazanım.
- **Efor:** S (portal talebi dahil S–M).
- **Bağımlılık:** Yok. `package_freezes` ve `client_package_balances` hazır.
- **Öncelik: Önce yap.**

### 3.4 Excel'den içe aktarma ve tüm veriyi dışa aktarma

- **Ne:** "Excel'ini yükle": ad, telefon, kalan ders ve paket bitiş tarihi sütunlarını eşleştirme ekranı, önizleme ve hata listesiyle. Kalan ders, "açılış bakiyesi" olarak bir paket kaydına çevrilir. Tersi için Ayarlar'da "Verimi indir" (danışanlar, paketler, dersler, ödemeler; Excel ya da CSV).
- **Neden fark yaratır:** Hedef kitlenin verisi Excel'de ya da kafasında. Yerel rakiplerden Gymtekno "kurulum ve geçiş desteği", merkezim "aynı gün ücretsiz veri taşıma" vaat ediyor. Kendi kendine 5 dakikada içe aktarma, beyaz eldiven onboarding'i ölçeklenebilir kılar. Dışa aktarma da Mindbody'ye yönelik "verimiz rehin" şikayetine ([Vibefam – Mindbody Capterra özeti](https://vibefam.com/what-mindbody-users-actually-say-on-capterra-2026/)) karşı güven mesajı olur.
- **Efor:** M (içe aktarma M, dışa aktarma S).
- **Bağımlılık:** Yok. Paket bakiyesi yoklamadan türediği için açılış bakiyesinin nasıl temsil edileceği tasarlanmalı (ör. paket `lessonCount` = kalan ders, geçmiş ders yok). Ayrı bir kalan-sayaç **tutulmamalı**.
- **Öncelik: Önce yap.** Betaya alınacak her eğitmenin ilk engeli bu.

### 3.5 Public sayfadan deneme dersi

- **Ne:** `/<slug>` sayfasına "Deneme dersi al" butonu. Aday, müsaitlik kurallarından (`availability_rules`) türeyen boş saatlerden birini seçer, adını, telefonunu ve kısa kayıt formunu doldurur. Eğitmen Başvurular'da "Onayla" dediğinde ders takvime düşer ve adaya portal linki gider. Deneme ücretli ya da ücretsiz olabilir (tek derslik paket olarak). Ders sonrası Bugün ekranında "Deneme yaptı, paket teklif et" hatırlatması çıkar.
- **Neden fark yaratır:** Instagram'dan gelen adayın ilk sorusu genelde "deneme dersi var mı, ne zaman boşsunuz?" Bu soru DM'de onlarca mesaj demek. Global kaynaklar da DM'nin satış için verimsiz olduğunu, amacın adayı hızla bir randevuya yönlendirmek olduğunu söylüyor ([PT Distinction](https://www.ptdistinction.com/blog/instagram-for-personal-trainers), [Inro](https://www.inro.social/blog/instagram-dm-sales-funnel)). Başvuru ve portal rezervasyonu zaten var. Deneme dersi bu iki parçayı birleştiriyor. Yerel rakiplerde eğitmene özel bir deneme dersi hunisi görmedik.
- **Efor:** M. Başvuru, müsaitlik ve rezervasyon kodu yeniden kullanılır.
- **Bağımlılık:** Yok.
- **Öncelik: Önce yap.**

### 3.6 Paket bitmeden yenileme teklifi

- **Ne:** Kalan ders 2'ye indiğinde (ya da son kullanım tarihine 7 gün kaldığında) portalda danışana "Paketin bitmek üzere" kartı çıkar. Kartta eğitmenin paketleri, nakit ve taksit fiyatı ve "Bu paketi istiyorum" butonu olur. Bu mevcut paket talebi akışını kullanır. Eğitmene de aynı anda Bugün ekranında hazır mesajlı bir kart düşer (bu kısım bugün kısmen var: `lowBalance` ve `expiring`).
- **Neden fark yaratır:** Solo eğitmenin gelirinin sürekliliği yenilemede. piSEANS ve PilatesYap "paket bitti" bildirimi gönderiyor. Bizde bildirim doğrudan satın alma talebine çevriliyor. **Dikkat:** Mesaja indirim ya da kampanya eklenirse İYS kapsamında ticari ileti olur (önceki araştırma, bölüm 8.3). Varsayılan metin bilgilendirme olarak kalmalı.
- **Efor:** S.
- **Bağımlılık:** Yok (e-posta bildirimi için 3.1'deki cron).
- **Öncelik: Önce yap.** Ucuz ve doğrudan gelir getiren bir özellik.

### 3.7 Eğitmen için anlık bildirim (PWA push)

- **Ne:** Ana ekrana eklenmiş uygulamaya bildirim: yeni başvuru, ödeme bildirimi ve dekont, danışan iptali, bekleme listesinden yer kapıldı, paket talebi. Bugün bunların hepsi e-postayla gidiyor.
- **Neden fark yaratır:** Eğitmen gün boyu ders veriyor, e-postaya bakmıyor. Rakiplerin native uygulamaları bildirim gönderiyor. PWA push ile bu farkı native uygulama yazmadan kapatırız. iOS'ta yalnızca ana ekrana eklenmiş PWA'da çalışıyor, onboarding'de bunu öğretmek gerekir.
- **Efor:** M (service worker, abonelik tablosu, VAPID, bildirim tercihleri).
- **Bağımlılık:** Yok. Ücretsiz.
- **Öncelik: Sonra** (Faz 1'in ikinci yarısı).

### 3.8 Haftalık özet: gelir, doluluk, kaybolan danışanlar

- **Ne:** Her pazartesi sabahı eğitmene tek ekranlık bir özet (uygulamada kart, isteğe bağlı e-posta): geçen hafta verilen ders, tahsilat ve bekleyen tutar, grup derslerinde doluluk oranı, geç iptal ve gelmedi sayısı, **"3 haftadır gelmeyen danışanlar"** listesi (her birinin yanında hazır bir "Seni özledik" mesajı) ve bu hafta biten paketler.
- **Neden fark yaratır:** Plan4M ve merkezim rapor sayısıyla satıyor ("23 hazır rapor"). Solo eğitmen rapor ekranı açmaz. Ona haftada bir, ne yapacağını söyleyen tek bir sayfa lazım. Kaybolan danışan uyarısı önceki araştırmada V2'ye AI olarak yazılmıştı. AI'ya gerek yok, basit bir sorgu yeterli.
- **Efor:** S–M.
- **Bağımlılık:** Cron.
- **Öncelik: Sonra.**

### 3.9 Ölçüm takibi (ilk sürüm fotoğrafsız)

- **Ne:** Danışan detayında "Ölçüm ekle": kilo, bel, basen ve eğitmenin tanımladığı alanlar. Kayıt formundaki alan ve birim altyapısı yeniden kullanılır. Portalda danışana basit bir çizgi grafik gösterilir. Fotoğraf ikinci adımda.
- **Neden fark yaratır:** Tek başına **fark yaratmaz.** GymKod, BulutGym ve Gymtekno'da var. Ama PT tarafında paket yenilemenin en güçlü argümanı ("bak, 6 haftada bel 4 cm") ve satışta sorulacak. Portalda grafik olması danışanın linki tekrar açması için sebep olur. Ölçüler büyük ihtimalle özel nitelikli veri, açık rıza akışına bağlanmalı. Fotoğraf KVKK riskini ve depolama maliyetini büyütür, o yüzden ertelenmeli.
- **Efor:** M (fotoğrafla L).
- **Bağımlılık:** Mevcut sağlık rızası akışı. Fotoğraf için Supabase Storage ve erişim kuralları.
- **Öncelik: Sonra.** PT kullanıcıları betada isterse öne çekilir. Pilates eğitmenleri için düşük öncelik.

### 3.10 Takvim aboneliği (ICS)

- **Ne:** Eğitmene özel, gizli bir `.ics` linki. Google Takvim ya da iPhone Takvim'e bir kez eklenir, dersler salt okunur görünür. İsteğe bağlı olarak danışanın portalında da "takvimime ekle".
- **Neden fark yaratır:** Eğitmenin özel hayatı telefon takviminde. İki yönlü Google senkronu pahalı ve kırılgan. Tek yönlü ICS, ihtiyacın büyük kısmını birkaç satır kodla karşılar.
- **Efor:** S.
- **Bağımlılık:** Yok.
- **Öncelik: Sonra.** Arada kalan bir güne sığar.

### 3.11 Kartla ve taksitle online ödeme (iyzico)

- **Ne:** Portalda "Kartla öde" butonu. iyzico "Link ile Ödeme" ya da pazaryeri alt üye modeli.
- **Neden şimdi değil:** Danışan parası eğitmene gidiyor. Platformun bu akışta aracı olması pazaryeri sözleşmesi ve büyük ihtimalle şirket gerektiriyor. iyzico şirketsiz bireysel kullanıcıya "Link ile Ödeme" açıyor, ama bu **eğitmenin kendi hesabı** ([iyzico – Link yöntemi](https://www.iyzico.com/destek/yardim-merkezi/urunler-ve-ozellikler/link-ile-odeme-al), [iyzico – Fiyatlandırma](https://www.iyzico.com/destek/yardim-merkezi/genel-bilgiler/fiyatlandirma)). Bireysel komisyon %4,19 + 0,25 TL'den başlıyor. Türkiye'de eğitmenlerin çoğu havale ve nakit alıyor, havale akışımız zaten iyi.
- **Ara çözüm (S):** Eğitmen kendi iyzico ya da PayTR ödeme linkini paket şablonuna yapıştırır, portalda "Kartla öde" butonu bu linke gider. Ödeme geldiğinde eğitmen işaretler. Entegrasyon yok, risk yok.
- **Efor:** Tam entegrasyon L. Ara çözüm S.
- **Bağımlılık:** Şirket kuruluşu, iyzico pazaryeri başvurusu.
- **Öncelik:** Ara çözüm **Sonra**, entegrasyon **Belki** (Faz 2).

### 3.12 E-arşiv fatura ve e-SMM (Paraşüt)

- **Ne:** Ödeme onaylanınca eğitmenin Paraşüt hesabında fatura ya da serbest meslek makbuzu taslağı oluşması.
- **Neden şimdi değil:** Eğitmenlerin vergi durumu karışık: şahıs şirketi, serbest meslek, stüdyoda bordrolu ya da kayıt dışı. Paraşüt e-SMM'ye geçişte ek ücret almıyor ve API sunuyor ([Paraşüt – e-SMM maliyeti](https://www.parasut.com/kullanim-kilavuzu/e-serbest-meslek-makbuzuna-gecmenin-maliyeti-nedir)), ama eğitmenin Paraşüt kullanıcısı olması, mali mühür ya da e-imzası olması gerekiyor. Betada kaç eğitmenin fatura kestiğini bilmiyoruz.
- **Ara çözüm (S):** Aylık tahsilat listesini mali müşavire gönderilecek formatta dışa aktarmak (3.4'ün parçası).
- **Efor:** L.
- **Bağımlılık:** Eğitmen tarafında Paraşüt hesabı. Betada talep doğrulaması.
- **Öncelik: Belki.** Önce betada "fatura kesiyor musun, nasıl?" sorusu sorulmalı.

### Değerlendirip Faz 1'e almadıklarım

| Fikir | Karar | Neden |
|---|---|---|
| **WhatsApp Cloud API ile tam otomatik mesaj** | Faz 2 | Maliyeti düşük, ama Meta işletme doğrulaması ve şablon onayı istiyor. Bu da pratikte şirket demek. 3.1 ve 3.2 API'siz tasarlanıyor, API gelince yalnızca gönderici değişir (`MessageProvider`). |
| **Reformer bazlı kapasite ve yer seçimi** | Belki | Solo eğitmende genelde 1–6 alet var, mevcut kapasite alanı bunu karşılıyor. "Yer seç" Mariana Tek gibi premium stüdyo yazılımlarının özelliği. Arızalı alet için kapasiteyi o günlük düşürmek (S) yeterli olabilir. |
| **Doğum günü mesajı** | Belki | Ucuz ama "ürünü bırakmama" sebebi değil. Haftalık özete bir satır olarak eklenebilir. İndirim içerirse İYS kapsamına girer. |
| **Çoklu eğitmen ve stüdyo modu** | Yapma (Faz 1) | Aşağıda, bölüm 5. |
| **İki yönlü Google Takvim** | Yapma (Faz 1) | ICS ihtiyacın çoğunu karşılıyor. OAuth, token yenileme ve çakışma çözümü solo geliştirici için pahalı. |

### Özet tablo

| # | Özellik | Efor | Bağımlılık | Öncelik |
|---|---|---|---|---|
| 3.1 | Ders öncesi onay ("Geliyor musun?") | M | Cron | **Önce yap** |
| 3.2 | Bekleme listesi ve boşalan yeri doldur | M | Cron, 3.1 | **Önce yap** |
| 3.3 | Paket dondurma | S | — | **Önce yap** |
| 3.4 | Excel içe aktarma ve veri dışa aktarma | M | — | **Önce yap** |
| 3.5 | Public sayfadan deneme dersi | M | — | **Önce yap** |
| 3.6 | Paket bitmeden yenileme teklifi | S | (Cron) | **Önce yap** |
| 3.7 | Eğitmen için PWA push bildirimi | M | — | Sonra |
| 3.8 | Haftalık özet ve kaybolan danışanlar | S–M | Cron | Sonra |
| 3.9 | Ölçüm takibi (fotoğrafsız) | M | Sağlık rızası | Sonra |
| 3.10 | Takvim aboneliği (ICS) | S | — | Sonra |
| 3.11 | Online ödeme (ara çözüm: eğitmenin kendi linki) | S / L | Şirket, iyzico | Sonra / Belki |
| 3.12 | E-arşiv ve e-SMM (Paraşüt) | L | Eğitmenin Paraşüt hesabı | Belki |

---

## 4. Önerilen sıralama (ilk 6 hafta)

Sıralama mantığı: önce betaya girişi kolaylaştır (içe aktarma), sonra en büyük açığı kapat (hatırlatma ve onay), sonra bunun üstüne gelir getiren akışları kur (bekleme listesi, deneme, yenileme).

| Hafta | İş | Çıktı |
|---|---|---|
| **1** | 3.3 Dondurma arayüzü · 3.4 Excel içe aktarma (dışa aktarma dahil) | Yeni eğitmen 5 dakikada verisini taşır. Dondurma talebi portalda. |
| **2** | Cron altyapısı · 3.1 Ders öncesi onay (portal butonları, Bugün listesi, e-posta) | Eğitmen her sabah tek listeden onay mesajlarını gönderir, cevaplar takvimde görünür. |
| **3** | 3.2 Bekleme listesi ve boşalan yer teklifi | Dolu grup dersinde sıra, iptalde otomatik teklif. |
| **4** | 3.5 Deneme dersi · 3.6 Yenileme teklifi | Instagram'dan gelen aday tek linkle deneme dersi alır. Biten paket portalda talebe döner. |
| **5** | 3.7 PWA push · 3.8 Haftalık özet | Eğitmen e-postaya bakmadan haberdar olur. Pazartesi özeti. |
| **6** | Tampon: beta geri bildirimleri · 3.10 ICS · 3.11 ara çözüm (ödeme linki alanı) | Betadan gelen en acil 2–3 düzeltme. Ölçüm takibine (3.9) karar. |

Her hafta sonunda 3–5 beta eğitmenine kısa bir soru gönderilmeli: "Bu hafta hangi işi hâlâ WhatsApp'tan ya da Excel'den yaptın?" Yol haritası bu cevaba göre kaydırılmalı.

---

## 5. Yapmamamız gerekenler

- **Antrenman programı editörü ve egzersiz video kütüphanesi.** Trainerize, Everfit, Harbiz ve PTWith'in alanı. Harbiz video kütüphanesini ayrıca ücretle satıyor ([Harbiz fiyatlar](https://www.harbiz.io/en/pricing)). Ağır bir iş ve bizim çekirdeğimiz (ders, paket, para) değil. Gerekirse ders notuna serbest metin yeterli.
- **Beslenme ve makro takibi.** Aynı gerekçe. Ayrıca sağlık verisi riskini büyütür.
- **Çoklu eğitmen, oda, komisyon, turnike, QR check-in.** GymKod, Plan4M ve BulutGym bu alanda 1.000–1.500 TL/ay fiyatla ve yıllarca biriktirdikleri özelliklerle yarışıyor ([GymKod](https://gymkod.com/pilates-studyo-yazilimi), [Plan4M](https://plan4m.com/)). Solo eğitmen için gereksiz karmaşa. Veri modeli ileride `org_id` eklemeye izin veriyor, ama Faz 1'de dokunulmamalı.
- **Native mobil uygulama (eğitmen ya da danışan).** Portalın "uygulama indirme" avantajını kendi elimizle bozar. PWA ve push yeterli.
- **Kampanya, kupon ve toplu pazarlama mesajı.** merkezim'in güçlü olduğu alan. Bizim için İYS yükümlülüğü ve spam riski demek. Yenileme ve geri kazanma mesajları bilgilendirme tonunda kalmalı.
- **Danışandan kartla geç iptal ücreti çekmek.** Momence bunu otomatikleştiriyor ([Momence yardım](https://help.momence.com/en/articles/10166934-automate-appointment-no-show-late-cancellation-fees)). Türkiye'de kayıtlı kart alışkanlığı yok, solo eğitmen–danışan ilişkisinde de itici. Bizdeki "ders yanar" kuralı yeterli.
- **Pahalı bir AI ek paketi.** Momence'ın AI ek paketi ayda yüzlerce dolar (önceki araştırma). Kaybolan danışan uyarısı ve mesaj taslakları için basit sorgu ve hazır şablon yeterli.
- **İki yönlü takvim senkronu ve tam Paraşüt entegrasyonu (Faz 1'de).** Talep doğrulanmadan L eforlu entegrasyonlara girmemeliyiz.

---

## 6. Kaynaklar

**Türkiye – rakipler**
- [piSEANS – Personal trainer danışan yönetimi](https://pirus.tr/personal-trainer-icin-danisan-yonetimi-seans-takibinden-odemeye-tam-cozum)
- [piSEANS – Pilates stüdyo yazılımı](https://pirus.tr/pilates-ve-yoga-studyolari-icin-randevu-ve-uye-takip-sistemi)
- [GymKod – Pilates stüdyo yazılımı](https://gymkod.com/pilates-studyo-yazilimi)
- [Plan4M](https://plan4m.com/)
- [BulutGym – Stüdyo ders yönetimi](https://www.bulutgym.com/studyo-ders-yonetimi.html)
- [Gymtekno – Pilates ve reformer salonları](https://gymtekno.com/tr/pilates-reformer-salonlari)
- [PilatesYap](https://pilatesyap.com/)
- [merkezim](https://merkezim.com)
- [NetFit](https://www.netfitapp.com/)

**Türkiye – şikayetler ve kullanıcı davranışı**
- [Şikayetvar – Pilates şikayetleri](https://www.sikayetvar.com/pilates)
- [Şikayetvar – Body Control Studio kayıt iptali ve dondurma](https://www.sikayetvar.com/body-control-studio/body-control-studio-kayit-iptaldondurma-hakkinda)
- [Şikayetvar – Ders ve pilates şikayetleri](https://www.sikayetvar.com/ders/pilates)

**Global rakipler ve incelemeler**
- [Momence – Geç iptal ve gelmedi ücretleri](https://help.momence.com/en/articles/10166934-automate-appointment-no-show-late-cancellation-fees)
- [Momence – Bekleme listesi SSS](https://help.momence.com/en/articles/12026801-waitlist-faq-s-appointments)
- [Vibefam – Glofox Reddit yorumları (rakip kaynak)](https://vibefam.com/glofox-reviews-reddit-2026/)
- [Vibefam – Arketa incelemesi (rakip kaynak)](https://vibefam.com/arketa-review-pricing-features-pros-cons-2026/)
- [Vibefam – Mindbody Capterra özeti (rakip kaynak)](https://vibefam.com/what-mindbody-users-actually-say-on-capterra-2026/)
- [Capterra – Mindbody yorumları](https://www.capterra.com/p/40229/MINDBODY/reviews/)
- [Trustpilot – ABC Trainerize](https://www.trustpilot.com/review/trainerize.com)
- [AI Tools Bakery – Trainerize incelemesi](https://aitoolsbakery.com/blog/trainerize-review/)
- [Harbiz – Fiyatlar](https://www.harbiz.io/en/pricing)
- [Coachway – Everfit fiyatları](https://coachway.io/articles/everfit-pricing/)
- [Everfit – Ödeme komisyonları](https://help.everfit.io/en/articles/5684968-processing-fees-for-payments)

**Instagram ve müşteri kazanımı**
- [PT Distinction – Instagram for personal trainers](https://www.ptdistinction.com/blog/instagram-for-personal-trainers)
- [Inro – Instagram DM satış hunisi](https://www.inro.social/blog/instagram-dm-sales-funnel)

**Altyapı, ödeme, fatura**
- [Meta – WhatsApp Business Platform fiyatlandırması](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- [EngageLab – WhatsApp API fiyatları ve 1 Ekim 2026 değişikliği](https://www.engagelab.com/blog/whatsapp-business-api-pricing)
- [iyzico – Link ile ödeme](https://www.iyzico.com/destek/yardim-merkezi/urunler-ve-ozellikler/link-ile-odeme-al)
- [iyzico – Fiyatlandırma](https://www.iyzico.com/destek/yardim-merkezi/genel-bilgiler/fiyatlandirma)
- [iyzico – Pazaryeri ödeme çözümü](https://www.iyzico.com/destek/yardim-merkezi/urunler-ve-ozellikler/pazaryeri-odeme-cozumu)
- [Paraşüt – e-SMM maliyeti](https://www.parasut.com/kullanim-kilavuzu/e-serbest-meslek-makbuzuna-gecmenin-maliyeti-nedir)
- [Paraşüt – e-SMM nedir, kimler için zorunlu](https://www.parasut.com/kullanim-kilavuzu/parasut-ile-e-serbest-meslek-makbuzuna-gecmenin-faydalari-nelerdir)

**İç kaynak**
- [PAZAR_ARASTIRMASI.md](../PAZAR_ARASTIRMASI.md): önceki rakip analizi, fiyatlar, KVKK ve İYS notları
