# PT & Pilates Eğitmen Takip Uygulaması — Pazar Araştırması ve Teknik Yol Haritası

> Hazırlanma tarihi: 29 Eylül 2026
> Kapsam: Global rakipler, Türkiye pazarı, kullanıcı şikayetleri, farklılaşma, MVP kapsamı, lansman planı, hukuki/şirket konuları, tech stack ve maliyet.
> **Not:** Fiyatlar ilgili sayfalardan 2025–2026'da derlendi, değişmiş olabilir. "Tahmin" olarak işaretlenen rakamlar düşük güvenilirliklidir. Hukuki bölümler bilgi amaçlıdır, avukat/mali müşavir görüşünün yerini tutmaz.

---

## 1. Yönetici Özeti

- **Problem gerçek ve doğrulanmış.** Türkiye'de solo PT ve pilates eğitmenleri danışanlarını WhatsApp + Excel + not defteri ile yönetiyor. Rakiplerin pazarlama mesajı bile doğrudan "WhatsApp ve Excel'i bırakın" (GymKod, piSEANS, BodyPro). Gumroad'da 10 dolarlık "seans takip Excel şablonu" satılıyor olması, tablo ile tam kapsamlı stüdyo yazılımı arasında bir boşluk olduğunu gösteriyor.
- **Pazar üç gruba bölünmüş, hiçbiri solo eğitmene tam uymuyor:**
  1. *Online koçluk uygulamaları* (Trainerize, TrueCoach, Everfit, PTWith): antrenman programı odaklı. Yüz yüze ders/paket sayımı ikinci planda, çoğu zaman ek paket olarak satılıyor.
  2. *Stüdyo yazılımları* (Mindbody, Glofox, Momence, GymKod, Plan4M): paket/kredi sistemi güçlü ama pahalı (global 99–700 $/ay, yerel 1.000–1.500 TL/ay), karmaşık, çok eğitmenli stüdyo için tasarlanmış.
  3. *Genel randevu araçları* (Calendly, Acuity): ucuz ve modern, ama fitness bağlamı ve danışan kaydı yok.
- **Türkiye'de rakip var ama pazar kilitlenmemiş.** Yerel oyuncular (NetFit, piSEANS, GymKod, Plan4M, PTWith) klasik KOBİ yazılımı görünümünde. Solo eğitmen için gerçekten sade, mobil öncelikli, iyi tasarlanmış bir ürün yok.
- **Kazanma stratejisi:** "Eğitmenin cebindeki ders defteri". Dersi 2 dokunuşla işle, paket otomatik düşsün, kim ne kadar borçlu tek ekranda görünsün. Danışan hiçbir şey indirmesin; WhatsApp'tan gelen bir linkle kalan dersini ve randevusunu görsün.
- **Tech stack önerisi:** Next.js + TypeScript + Tailwind + shadcn/ui (PWA), Supabase (Postgres, Frankfurt), Drizzle. Hosting için Cloudflare veya Vercel. Beta süresince maliyet ≈ 0 $.
- **Şirketsiz ücretsiz beta mümkün.** Gelir yoksa şirket gerekmez, ama **KVKK ilk günden geçerli**. Sağlık verisini (sakatlık, hamilelik, ölçüler) opsiyonel ve açık rızalı tut.

---

## 2. Global Rakip Analizi

### 2.1 Online koçluk platformları

| Ürün | Hedef | Fiyat (USD, aylık) | Ücretsiz / deneme | Türkçe |
|---|---|---|---|---|
| **ABC Trainerize** | Solo PT'den büyük stüdyoya | Basic ücretsiz (1 danışan); Grow 9 $ (2); Pro 23 $'dan (5 danışan, 200'e kadar kademeli); Studio Plus 248 $'dan. Ek paketler: Stripe ödeme +10 $, Business (randevu) +25 $, beslenme +20–45 $, markalı uygulama 169 $ | 30 gün | Yok |
| **TrueCoach** | Online koç, programlama | 26 $ (5 danışan) / 58 $ (20) / 137 $ (50) | 14 gün | Yok |
| **PT Distinction** | Solo PT'den ekiplere | 19,90 $ (3 danışan, sonra +6 $/danışan) / 59,90 $ / 89,90 $ | 1 ay | Yok |
| **Everfit** | Solo'dan stüdyoya | Ücretsiz (5 danışan); Pro 19–290 $; Studio 105–430 $. Ödeme & paket ek paketi +8–9 $ | Kalıcı ücretsiz plan | Yok |
| **My PT Hub** | Yüz yüze + online hibrit PT | 25 € (3 danışan) / 59 € (sınırsız) / 215 € | 30 gün | Yok |
| **Kahunas** | Online vücut geliştirme koçları | 35 $ / 69 $ / 99 $ | 14 gün | Yok |
| **TrainHeroic** | Kuvvet ve spor koçları | 9,99 $ (1 sporcu) → 399 $ (1.000) | 14 gün | Yok |
| **Harbiz** | Solo PT ve küçük stüdyo (İspanya) | 19 € / 119 € / 199 € (yıllık fiyat) | 14 gün | Doğrulanamadı |
| **Exercise.com** | Yerleşik eğitmen ve salonlar | Şeffaf değil, ~239 $/ay (demo ile) | Demo | Yok |

**Gözlemler**
- **Fiyatlandırma çoğunlukla danışan başına.** Trainerize'da 50 danışanla ayda yaklaşık 250 $ ödeniyor ve bu şikayet konusu.
- **Paket ve ders sayımı ikinci planda.** Everfit'te 8–9 $'lık ek paket, Trainerize'da 10 + 25 $'lık ek paketlerle geliyor.
- **UX referansları:** TrueCoach ve Everfit temiz ve mobil öncelikli. PT Distinction ve Mindbody ise kaçınılması gereken örnekler (kalabalık, öğrenmesi zor).

### 2.2 Stüdyo ve salon yönetimi

| Ürün | Hedef | Fiyat |
|---|---|---|
| **Glofox (ABC)** | Butik stüdyolar | 99 $/ay'dan başlıyor, üst paketler teklifle, genelde yıllık sözleşme. **Türkçe destekleyen tek global araç.** |
| **Mindbody** | Stüdyo, spa, salon + tüketici pazaryeri | Fiyat yayınlanmıyor, ~99–699 $/ay. Pratikte 1.000 $/ay'ı geçebiliyor. 90 gün iptal edilemez, 12 ay otomatik yenileme. |
| **Momence** | Butik ve pilates | Ücretsiz plan ama %5 + %4 komisyon; Pro 60 $ + %2,5; Custom 199 $; AI Agent **+399 $/ay** |
| **Arketa** | Pilates ve yoga | 49 / 83 / 124 $ + Stripe üstüne %3 (efektif ~%6) |
| **bsport** | Premium butik | ~149 $/ay, reformer seçimi var |
| **Mariana Tek** | Premium butik | 300–800 $+, "pick-a-spot" kat planı, çok yıllık sözleşme iddiaları |
| **WellnessLiving** | Geniş kapsamlı | 69–349 $ ilan ediliyor, pratikte 200–500 $+ |
| **Walla** | Pilates ve yoga | 199–599 $. Grup dersinde iyi, özel derste zayıf |
| **TeamUp / Punchpass** | Küçük stüdyo | ~99 $'dan, aktif müşteri sayısına göre |
| **Zen Planner / Wodify / Gymdesk** | Salon, CrossFit | 75–348 $ |
| **Vagaro** | Salon ve spa, fitness | 30 $ (1 takvim) + 10 $/ek takvim |
| **Fitune** | Pilates | Kalıcı ücretsiz plan |

### 2.3 Genel randevu araçları

| Ürün | Fiyat | Not |
|---|---|---|
| **Calendly** | Ücretsiz / 10 $ / 16 $ | Paket ancak Teams planında |
| **Acuity** | 16–49 $ | Paket ve üyelik Standard plandan itibaren |

Birçok solo PT "Calendly/Acuity + WhatsApp + Excel" üçlüsünü kullanıyor. Bizim değiştirmek istediğimiz iş akışı tam olarak bu.

---

## 3. Türkiye Pazarı

### 3.1 Yerel rakipler

| Ürün | Hedef | Öne çıkanlar | Fiyat (TL) |
|---|---|---|---|
| **NetFit** | Bağımsız PT'den salona (**bize en yakın**) | Danışan, takvim, mesajlaşma, ders kredisi ve geçerlilik süresi, antrenman şablonları, pazaryeri listesi | Ücretsiz (3 danışan) / 690 (15 danışan) / 1.290 (sınırsız) |
| **piSEANS (Pirus)** | Bağımsız PT, pilates | Online randevu, **WhatsApp Business hatırlatma**, seans notu + foto, paketten otomatik düşme, **taksit takibi**, KVKK vurgusu | Yayınlanmamış |
| **PTWith** | Bağımsız PT | Antrenman ve beslenme programı, 400+ video, AI plan. Paket ve ödeme odaklı değil | 600 / 1.000 / 2.000 |
| **GymKod Pro** | Çok eğitmenli pilates stüdyosu | Eğitmen ve oda takvimi, çakışma engeli, telafi kredisi, komisyon, QR check-in | 1.000/ay + KDV, **ilk 3 ay ücretsiz** |
| **Plan4M** | Pilates, PT, butik | 300+ stüdyo iddiası | 1.500/ay + KDV |
| **BulutGym** | Salon ve stüdyo | Üyelik, SMS, kafe | 13.440–23.520/yıl |
| **Gymsoft, OxyFitClub, Gymtekno, GymPro** | Klasik salon | Turnike ve üyelik | ~900–1.500/ay |
| **Salon Randevu, Clinyo, Randevum** | Kuaför ve genel randevu | Genel randevu + SMS | 0–149/ay |

**Çıkarımlar**
- **Stüdyo segmenti dolu ve fiyatı ~1.000–1.500 TL/ay.** Çok eğitmen, oda ve komisyon gibi özellikler solo eğitmen için fazla.
- **Solo PT segmentinde asıl rakip NetFit ve piSEANS.** İkisinin de UI'ı ve konumlanması geliştirilebilir. PTWith ise programlama tarafında.
- **"3 ay ücretsiz" pazarda bir beklenti haline gelmiş** (GymKod). Bizim ücretsiz beta stratejimizle uyumlu.
- Yerel ürünlerin çoğu klasik KOBİ yazılımı görünümünde ve özellik kalabalığı ile satıyor. **Modern, sade, mobil öncelikli tasarım gerçek bir farklılaştırıcı.**

### 3.2 Pazar büyüklüğü

- **Pilates stüdyoları:** Mayıs 2026 Google Places analizine göre 49 ilde **~1.913 stüdyo**: İstanbul 788 (%38), İzmir 183, Ankara 136. Evde ders veren ve salon içindeki eğitmenler dahil değil, yani bu bir alt sınır.
- **Reformer pilates** son 5 yılda varsayılan format haline geldi. Klinik ve hamile pilatesi niş ama büyüyor.
- **Spor salonları:** 2010'da ~1.500, 2024'te 6.000+. Yaklaşık 2 milyon üye.
- **PT ve eğitmen sayısı:** Resmi veri yok. Armut'ta 1.790+ PT listeleniyor. **Tahmin: kendi danışanı olan aktif 5.000–15.000 PT ve pilates eğitmeni** (düşük güven).
- **Ürün hedefi için:** İlk 12 ayda 100–300 aktif eğitmen gerçekçi bir doğrulama hedefi.

### 3.3 Fiyatlar ve paket yapıları (2026)

- **PT seansı:** çoğunlukla 500–2.000 TL. İstanbul ve Ankara'da 1.500–2.000 TL, Anadolu'da 500–1.000 TL.
- **Grup reformer:** ders başı 170–550 TL. **Özel reformer:** 500–1.700 TL.
- **Örnek stüdyo (Ataşehir):**
  - Özel ders: 4 ders 5.300 TL, 12 ders 14.000 TL
  - Düet: 2.800–7.600 TL/ay
  - Trio: 2.500–6.700 TL/ay
- **Paket yapısı:**
  - 4 / 8 / 12 derslik (haftada 1 / 2 / 3) ya da 10'luk paketler.
  - Türler: **özel, düet, trio, grup.**
  - İki mod var:
    - **Sabit saat:** aylık, aynı gün ve saat, erteleme yok.
    - **Esnek:** 5–7 hafta geçerlilik, 24 saat önceden haber vererek erteleme.

**Önemli çıkarım:** Bir eğitmenin danışanı aylık 5.000–15.000 TL ödüyor. Aylık 200–400 TL'lik bir araç, eğitmenin tek bir dersinden daha ucuz. Değer önerisi kolay anlatılır.

### 3.4 Kullanıcı davranışı

- **WhatsApp** Türkiye'de en çok kullanılan uygulama (internet kullanıcılarının %88,6'sı, TÜİK 2025). **Instagram** %68,1. Pilates ve PT pazarlaması büyük ölçüde Instagram üzerinden yürüyor.
- **Ödeme:** nakit, havale/EFT (IBAN) ve kredi kartı karışık. Kartta komisyon farkı, nakitte indirim yaygın. Büyük paketlerde taksit var.
  - **Bu yüzden MVP'de online ödemeden çok manuel bir "ödendi / borçlu / kısmi / taksit" defteri gerekiyor.**
- **İptal kuralları:**
  - **24 saat kuralı standart**, geç iptalde "ders yanar".
  - 4 haftalık pakette ~1, 8 haftalıkta ~2 telafi hakkı.
  - Paket bitince kalan dersler yanar, bazen 1 hafta tolerans tanınır.
  - Tek seferlik dondurma hakkı var; doktor raporu varsa süre uzatılır.

---

## 4. Kullanıcı Şikayetleri (fırsat alanları)

> Kaynak uyarısı: Reddit alıntılarının çoğu rakip bir firmanın (Vibefam) blogundan ikinci el alındı; taraflı olabilir.

1. **Gizli fiyat ve sözleşme tuzağı.**
   - Mindbody'de ilan edilen fiyat pratikte 1.000 $/ay'ı geçebiliyor. Veri dışa aktarma ücreti ~500 $ ve iptali zor ("rehin tutuluyor gibiyiz").
   - Momence ve Mariana Tek'te fiyatı öğrenmek için satış görüşmesi gerekiyor.
2. **Danışan başına fiyat.** Danışan sayısı arttıkça fatura büyüyor; eğitmen büyüdükçe cezalandırılıyor.
3. **Karmaşıklık.**
   - Mindbody paneli "eski usul, sezgisel değil".
   - Trainerize'ın kurulumu 4–8 saat sürüyor.
   - Yüz yüze derste Trainerize bir incelemede "kağıt defterden daha yavaş" diye anılıyor.
4. **Kötü danışan uygulaması.**
   - Her stüdyo için ayrı giriş gerekiyor.
   - Müşteriler bir uygulama daha indirmek istemiyor.
5. **Paket ve kredi takibinde hatalar.**
   - "Kalan dersi olan müşteriden tam ücret çekildi."
   - "Onaylanan rezervasyon bekleme listesine düştü."
   - Tekrarlayan randevularda kredi takibi karışık.
6. **Yavaş ya da sadece yapay zekalı destek.** Momence'ta her seferinde farklı ajan, bağlam yok.
7. **Ödeme ve veri kaybı.** Arketa'nın taşıma sırasında ~300 müşterinin kart bilgisini kaybettiği bildiriliyor.

**Pilates'e özel, tam çözülmemiş ihtiyaçlar**
- Kapasite, sabit bir sayı yerine **reformer (alet) sayısıyla** sınırlanmalı; arızalı alet düşülebilmeli.
- Müşteri belirli bir reformeri seçebilmeli.
- Kredi ders türüne bağlanmalı (reformer dersi → reformer kredisi).
- Eğitmen aynı saatte iki yerde olamamalı (çakışma engeli).
- Paket süresi dolması, tek seferlik giriş teklifleri, dondurma hakları.
- Bekleme listesinden adil otomatik terfi.

---

## 5. Konumlanma ve Farklılaşma — Bizi Ne Öne Çıkarır?

### 5.1 Konumlanma cümlesi
> **"Excel ve WhatsApp'ı bırak. Danışanlarını, paketlerini ve ödemelerini tek ekrandan, 10 saniyede yönet."**
> Solo PT ve pilates eğitmeni için; Türkçe, TL, Türkiye'deki paket ve iptal kurallarına göre tasarlanmış.

### 5.2 Farklılaştırıcılar (önem sırasıyla)

1. **Hız odaklı UX ("ders defteri").**
   - Bugünün derslerini gösteren tek bir ana ekran.
   - Tek dokunuşla işaretleme: *Geldi / Gelmedi / Geç iptal (yandı) / Zamanında iptal*.
   - Paket bakiyesi otomatik düşer.
   - Hedef: dersi işlemek, Excel'e yazmaktan hızlı olsun.
2. **Türkiye'ye özel paket motoru** (rakiplerin genel "kredi" sistemi yerine):
   - Özel, düet, trio ve grup ders türleri; sabit veya esnek paket.
   - Geçerlilik süresi, telafi hakkı, dondurma, 24 saat kuralı.
   - Tüm kurallar eğitmen tarafından ayarlanabilir, varsayılanları hazır gelir.
3. **Danışan uygulama indirmez.**
   - Kişiye özel link (WhatsApp'tan gönderilir).
   - Danışan linkte kalan dersini, sıradaki randevusunu, paket bitiş tarihini ve ödeme durumunu görür.
   - Giriş gerekmez; imzalı token ile açılır.
4. **WhatsApp ile iç içe, WhatsApp'a rakip değil.**
   - MVP'de: `wa.me` linkleriyle **tek tıkla, önceden doldurulmuş mesaj** ("Yarın 10:00 dersimizi hatırlatırım", "Paketinde 2 ders kaldı", "Ödeme hatırlatması"). Maliyet sıfır, Meta onayı gerekmez, şirket gerekmez.
   - Sonra: WhatsApp Cloud API ile otomatik hatırlatmalar.
5. **Borç ve alacak netliği.** "Kim bana ne kadar borçlu?" tek ekranda. Kısmi ödeme ve taksit takibi var. Nakit, havale ve kart ayrı ayrı işaretlenir.
6. **Excel'den tek tıkla içe aktarma.** Kullanıcılarımızın verisi şu an Excel'de. Onboarding 5 dakikayı geçmemeli.
7. **Şeffaf, sabit fiyat** (ücretli döneme geçince).
   - Danışan başına ücret yok, komisyon yok, sözleşme yok.
   - Verinin tamamı istendiği an dışa aktarılabilir.
   - Hem global hem yerel pazarın bir numaralı şikayetine doğrudan cevap.
8. **Güven ve KVKK.**
   - Hazır aydınlatma metni ve açık rıza şablonu.
   - Sağlık alanları opsiyonel.
   - Rakiplerin çoğu bunu pazarlamada kullanmıyor; bizim için güven unsuru.
9. **Pratik ve ucuz AI (V2).**
   - Ders notlarından özet çıkarma.
   - "Bu danışan 3 haftadır gelmiyor" uyarısı ve geri kazanma mesajı taslağı.
   - Momence gibi aylık 399 $'lık ek paket yaklaşımı yok.

### 5.3 Bilinçli olarak yapmayacaklarımız (MVP'de)
- Antrenman programı editörü ve egzersiz video kütüphanesi. PTWith ve Trainerize'ın alanı; ağır ve bizim çekirdeğimiz değil.
- Beslenme ve makro takibi.
- Çok şubeli stüdyo, eğitmen komisyonu, turnike.
- Markalı native uygulama.

---

## 6. MVP Kapsamı

### 6.1 Olmazsa olmaz (V1 — ücretsiz beta)

| Modül | Özellikler |
|---|---|
| **Kayıt ve giriş** | Google ile giriş + e-posta magic link. Eğitmen profili (ad, branş: PT, pilates, ikisi) |
| **Danışanlar** | Ad, telefon, not, hedef, etiket. Opsiyonel sağlık notu (açık rıza kutusu ile). Arşivleme. Arama |
| **Paket tanımları** | Şablonlar ("8 Ders Özel Reformer", "12 Ders Grup"). Ders sayısı, tür (özel/düet/trio/grup), geçerlilik günü, fiyat, telafi hakkı |
| **Danışana paket atama** | Başlangıç tarihi, otomatik bitiş, kalan ders, dondurma (tarih aralığı), süre uzatma |
| **Takvim ve randevu** | Gün ve hafta görünümü. Tekrarlayan ders ("her Salı-Perşembe 10:00"). Düet/grup için birden fazla danışan. Çakışma uyarısı |
| **Yoklama** | Bugünün dersleri ekranı. Geldi / Gelmedi / Geç iptal (yanar) / Zamanında iptal. Paketten otomatik düşme. Ders notu |
| **Ödeme defteri** | Paket satışında tutar. Ödeme ekle (nakit / havale / kart), kısmi ödeme, kalan borç. "Borçlular" listesi |
| **Uyarılar (uygulama içi)** | "Paketi bitmek üzere (≤2 ders)", "Paket süresi 7 gün içinde doluyor", "Borcu var", "X gündür gelmiyor" |
| **WhatsApp hızlı mesaj** | Hazır şablonlarla `wa.me` linki: hatırlatma, paket bitiyor, ödeme hatırlatma, danışan linkini paylaş |
| **Danışan portalı (link)** | Kalan ders, sıradaki randevular, paket bitişi, ödeme durumu, geçmiş dersler. Salt okunur |
| **İçe ve dışa aktarma** | Excel/CSV'den danışan içe aktarma. Tüm veriyi Excel olarak dışa aktarma |
| **Basit panel** | Bu ay verilen ders, bu ayki gelir (tahsil edilen / bekleyen), aktif danışan sayısı |
| **KVKK** | Aydınlatma metni, gizlilik politikası, hesap ve veri silme, sağlık verisi için açık rıza kaydı |
| **PWA** | Ana ekrana ekle, mobil öncelikli, hızlı açılış |

### 6.2 V1.5 (betadan gelecek geri bildirime göre)
- Danışanın linkten randevu talebi veya iptali (24 saat kuralı otomatik uygulanır)
- Web push bildirimleri (eğitmen için)
- Ölçüm ve ilerleme takibi (kilo, çevre ölçüleri, foto; açık rıza ile)
- Grup dersi kapasitesi ve bekleme listesi
- Reformer ve alet bazlı kapasite

### 6.3 V2 (ücretli dönem)
- Otomatik WhatsApp (Cloud API) ve SMS hatırlatmaları
- Online ödeme: eğitmenin bize aboneliği (iyzico/PayTR)
- Danışanın eğitmene platform üzerinden ödemesi (iyzico Pazaryeri, alt üye modeli)
- Küçük stüdyo modu: 2–5 eğitmen, oda ve alet
- AI: ders notu özeti, danışan kaybı uyarısı, mesaj taslakları
- E-arşiv fatura entegrasyonu (Paraşüt)

### 6.4 Başarı metrikleri (beta)
- **Aktivasyon:** Kayıttan sonraki 24 saat içinde ≥5 danışan ve ≥1 paket ekleyen eğitmen oranı (hedef %50+)
- **Tutunma:** 4. haftada hâlâ haftada ≥3 gün yoklama işleyen eğitmen oranı (hedef %40+)
- **Değer:** "Yarın bu uygulama kapansa ne kadar üzülürsün?" sorusuna "çok üzülürüm" diyen oran (hedef %40+, Sean Ellis testi)
- **Ödeme niyeti:** "Ayda X TL öder miydin?" anketi (150 / 250 / 400 TL seçenekleri)

---

## 7. Lansman ve Doğrulama Planı (şirketsiz, ücretsiz)

### 7.1 Instagram üzerinden eğitmenlere ulaşma
1. **Hedef listesi:** İstanbul, İzmir ve Ankara'da 1.000–20.000 takipçili, bağımsız PT ve pilates eğitmenleri (stüdyo sahibi olmayan veya 1–2 kişilik stüdyolar). Pilates stüdyolarının %54'ü bu üç şehirde.
2. **Mesaj yaklaşımı:** Satış değil, dert ortaklığı. Örnek:
   > "Merhaba [isim], danışan ve paket takibini hâlâ Excel/WhatsApp'tan mı yapıyorsun? Eğitmenler için ücretsiz bir takip uygulaması geliştiriyorum. İlk 20 eğitmene tamamen ücretsiz açıyorum, karşılığında sadece fikrini istiyorum. 10 dakikalık bir görüşmeye var mısın?"
3. **Ücretsiz teklif:** "Kurucu eğitmen" programı. Beta ücretsiz; ücretli döneme geçince ömür boyu %50 indirim veya ilk 6 ay ücretsiz sözü ver. Bu kullanıcıyı bağlar ve ödeme niyetini ölçer.
4. **Beyaz eldiven onboarding:** İlk 10–20 eğitmenin Excel'ini sen içe aktar, 15 dakikalık görüntülü görüşmeyle kurulumu yap. Kullanılmayan özellikleri de burada öğrenirsin.
5. **Ağızdan ağıza:** Danışan portalına küçük bir "[Uygulama] ile yönetiliyor" bağlantısı koy. Danışanlar arasında başka eğitmenler de olabilir.
6. **İçerik:** Reels ve kısa videolar: "Excel'de 5 dakika süren iş, 10 saniyede." Önce ve sonra karşılaştırması.

### 7.2 Takvim önerisi
| Hafta | İş |
|---|---|
| 1–6 | MVP geliştirme (bölüm 6.1) |
| 5–6 | 30–50 eğitmenlik Instagram listesi, ilk görüşmeler (ürün bitmeden de problem görüşmesi yapılabilir) |
| 7 | 5 eğitmenle kapalı alfa |
| 8–12 | 20–30 eğitmenle beta, haftalık geri bildirim |
| 12+ | Ödeme niyeti anketi. ≥10–20 eğitmen "öderim" derse şahıs şirketi kur, ücretli plana geç |

### 7.3 İleride fiyatlandırma önerisi (tahmin)
- **Ücretsiz:** 5 aktif danışan (NetFit 3 danışan veriyor, biraz daha cömert olalım)
- **Pro:** ~249–349 TL/ay, sınırsız danışan (NetFit'in 690 TL'lik planının altında, stüdyo araçlarının 1.000–1.500 TL'sinin çok altında)
- **Stüdyo:** ~599–899 TL/ay, 2–5 eğitmen
- Yıllık ödemede 2 ay ücretsiz. Danışan başına ücret ve komisyon yok.

---

## 8. Hukuki ve Şirket Konuları

### 8.1 KVKK (ilk günden geçerli)
- **Roller:** Eğitmen *veri sorumlusu*, biz *veri işleyen*. Kullanım koşullarına bir veri işleme sözleşmesi (DPA) eklenmeli.
- **Sağlık verisi:** Sakatlık, hamilelik, kan grubu ve büyük ihtimalle vücut ölçüleri *özel nitelikli kişisel veri*.
  - KVKK bir spor salonunu kan grubunu rızasız işlediği için cezalandırdı (Karar 2022/1357).
  - Eğitmenler için **açık rıza** gerekli olmaya devam ediyor gibi görünüyor (avukatla teyit edilmeli).
- **Yurt dışında saklama (Supabase Frankfurt gibi):**
  - 7499 sayılı Kanun (1 Haziran 2024) sonrası bu bir *yurt dışına aktarım*.
  - Yeterlilik kararı yok; **standart sözleşme** imzalanıp **5 iş günü içinde KVKK'ya bildirilmeli**. Bildirmemenin cezası ~90 bin–1,8 milyon TL.
  - Açık rıza artık sadece arızi (tek seferlik) aktarımlar için geçerli, sürekli barındırma için kullanılamaz.
- **Beta için pratik yaklaşım:**
  1. Veriyi minimumda tut. Sağlık alanları opsiyonel olsun, açık rıza kutusu ve kaydı tutulsun.
  2. Aydınlatma metni, gizlilik politikası ve hesap/veri silme özelliğini ilk sürümde yayınla.
  3. Ücretli lansmandan önce bir KVKK avukatından görüş al. Ya sağlayıcılarla standart sözleşme imzala ya da Postgres'i taşınabilir tut (Türkiye'de barındırma seçeneği: Turkcell Bulut, Türk Telekom Bulut, Huawei Cloud İstanbul, yerel VPS).
- **VERBİS:** Küçük işletmeler genelde muaf, ama ana faaliyet özel nitelikli veri işlemekse muafiyet olmayabilir. Kontrol edilmeli.

### 8.2 Şirket kurma
- **Ücretsiz beta:** Gelir yoksa şirket gerekmez. Bu dönemde IBAN'a gayriresmi para almaktan kaçın.
- **Para almaya başlarken: şahıs şirketi yeterli.**
  - Kuruluş ~1.500–13.500 TL (Mükellef gibi online servislerle ucuzlar).
  - Muhasebe ~3.000–3.600 TL/ay, artı Bağ-Kur.
  - **Genç girişimci muafiyeti:** 29 yaş altı ve ilk işletmeyse 3 yıl boyunca belirli bir tutara kadar gelir vergisi muafiyeti. 2026 tutarı için kaynaklar çelişiyor, mali müşavire sor.
- **Limited şirket:** ~30–42 bin TL kuruluş + 50 bin TL sermaye. Pazaryeri modeline (danışan ödemeleri) geçince gerekebilir.
- **Fatura:** GİB portalından ücretsiz e-arşiv fatura kesilebilir. Hacim artınca Paraşüt.
- **Dikkat:** GVK 20/B (uygulama geliştirici istisnası) kendi sitesinden satılan web SaaS'a **uygulanmıyor**.

### 8.3 Ticari ileti (İYS)
- **İYS onayı gerekmez:** OTP, randevu hatırlatma, abonelik/paket durumu ve ödeme hatırlatması ticari ileti sayılmaz.
- **İYS onayı gerekir:** Mesaja kampanya veya indirim eklenirse ("paketini yenile, %10 indirim") ticari iletiye dönüşür. Ürün içinde mesaj türleri ayrılmalı.

---

## 9. Tech Stack Önerisi

### 9.1 Özet
| Katman | Seçim | Neden |
|---|---|---|
| **Frontend** | **Next.js (App Router) + TypeScript** | En büyük ekosistem, shadcn örnekleri, AI ile kod üretiminde en iyi destek. Solo geliştirici için en hızlı yol |
| **UI** | **Tailwind v4 + shadcn/ui** (Radix) | Ücretsiz, bileşenlerin sahibi sensin, modern görünüm hızlı |
| **Uygulama tipi** | **PWA** (manifest + service worker, Serwist) | Eğitmen ana ekrana ekler. iOS 16.4+ web push, iOS 26'da ana ekrana eklenen site varsayılan olarak web app açılıyor |
| **Takvim** | **Schedule-X (core, MIT)** veya **FullCalendar Standard (MIT)** | Gün, hafta ve liste görünümü ücretsiz. Stüdyo kaynak görünümü gerekirse premium (~480 $/yıl) |
| **Backend / DB** | **Supabase** (Postgres + Auth + RLS + Storage + Edge Functions + pg_cron), **Frankfurt (eu-central-1)** | Paket ve kredi gibi ilişkisel veriye Postgres ideal. RLS ile çok kiracılı güvenlik. Standart Postgres olduğu için taşınabilir |
| **ORM** | **Drizzle** | SQL odaklı, hafif, edge uyumlu, RLS ile uyumlu |
| **Auth** | Google + e-posta magic link. Sonra SMS OTP (Netgsm veya İleti Merkezi, Supabase Send SMS Hook ile) | Başlangıçta SMS maliyeti yok |
| **Danışan portalı** | İmzalı token'lı link, sunucu tarafında çözülür | Danışan giriş yapmaz, DB'ye doğrudan erişmez |
| **Hosting** | **Cloudflare Workers (OpenNext)** veya **Vercel** | Aşağıdaki nota bak |
| **E-posta** | **Resend** (3.000/ay ücretsiz) | Magic link ve bildirimler |
| **Hata takibi** | **Sentry** (ücretsiz plan) | |
| **Analitik** | **PostHog Cloud EU** (1M olay/ay ücretsiz) | Ürün analitiği, session replay, feature flag |
| **i18n** | **next-intl** (TR varsayılan) | İ/ı sorununa dikkat: `toLocaleLowerCase('tr')`. TL ve tarih için `Intl` |
| **Arka plan işleri** | Supabase `pg_cron` + Edge Functions | Paket bitiş ve hatırlatma kontrolleri |

**Hosting notu:** Vercel Hobby planı **ticari kullanıma kapalı**. Ücretli döneme geçince Vercel Pro (20 $/kullanıcı/ay) gerekir. Beta için iki seçenek:
- (a) **Cloudflare Workers** free plan ticari kullanıma açık (OpenNext adaptörü ile Next.js çalışır).
- (b) Beta boyunca Vercel Hobby kullan, para almaya başlamadan Vercel Pro'ya geç.

Kurulum kolaylığı açısından (b), maliyet açısından (a) daha iyi. **Önerim: (b) ile hızlı başla, lansmanda maliyete göre karar ver.** Kod iki platformda da çalışacak şekilde taşınabilir tutulacak.

**Alternatifler neden seçilmedi**
- **Firebase:** NoSQL, paket, kredi ve rapor sorgularını zorlaştırır. Telefonla giriş ücretli plan ister.
- **Convex:** Geliştirici deneyimi harika, ama tescilli veritabanı; taşımak zor.
- **PocketBase:** Tüm operasyon (sunucu, yedek, ölçekleme) sende kalır.
- **Kendi backend'imiz (NestJS/Hono):** En çok kontrol, ama MVP'ye en yavaş yol.

### 9.2 Çok kiracılı veri modeli (taslak)
```
trainers          (id = auth.uid, ad, branş, ayarlar: iptal_saat=24, varsayılan kurallar)
clients           (id, trainer_id, ad, telefon, notlar, saglik_notu?, saglik_rizasi_at?, arsiv)
package_templates (id, trainer_id, ad, ders_sayisi, tur[ozel|duet|trio|grup], gecerlilik_gun, fiyat, telafi_hakki)
client_packages   (id, trainer_id, client_id, template_id?, toplam_ders, kalan_ders, baslangic, bitis, dondurma[], fiyat, durum)
sessions          (id, trainer_id, baslangic, bitis, tur, tekrar_kurali?, not)
session_attendees (session_id, client_id, client_package_id, durum[planli|geldi|gelmedi|gec_iptal|iptal])
payments          (id, trainer_id, client_id, client_package_id?, tutar, yontem[nakit|havale|kart], tarih, not)
portal_tokens     (client_id, token_hash, olusturma, iptal)
consents          (client_id, tur, metin_versiyonu, onay_at)
```
- Her tabloda `trainer_id` ve RLS politikası `trainer_id = auth.uid()` olacak. İleride stüdyo moduna geçerken `org_id` + üyelik tablosu eklenecek.
- **Paket bakiyesi**, yoklama kayıtlarından türetilecek (tek doğruluk kaynağı). Rakiplerin "yanlış kredi" hatası buradan kaynaklanıyor. `kalan_ders` bir cache olarak tutulup transaction ile güncellenecek.

### 9.3 Ödeme altyapısı (ileride)

**Kullanım senaryosu A: eğitmen bize abonelik öder**
| Sağlayıcı | Komisyon | Abonelik | Not |
|---|---|---|---|
| **PayTR** | ~%1,99–2,19 | Ek ücret yok, kayıtlı kartla tekrarlayan ödeme | Ertesi gün ödeme. Şubat 2026'da 2 günlük kesinti ve ani mağaza kapatma şikayetleri var |
| **iyzico** | ~%3,99–4,29 + 0,25 TL | Abonelik API'si (~199 TL/ay, 3 ay deneme) | Daha iyi dokümantasyon. Haftalık ödeme. Şahıs şirketi kabul ediliyor |
| **Param** | ~%2,2–2,3 | Tekrarlayan ödeme var | Alternatif |
| Stripe | — | — | **Türk şirketlerine kapalı.** Stripe Atlas (ABD LLC) yerel B2B için önerilmez |
| Paddle | ~%5 + 0,50 $ | Var | TL ödeme belirsiz, döviz ile ödeme yapıyor. Sadece yurt dışı müşteri için mantıklı |

**Öneri:** Başlangıçta **iyzico** (abonelik API'si ve dokümantasyon daha olgun, pazaryeri de aynı sağlayıcıda). Maliyet önemliyse PayTR. Kodda `PaymentProvider` arayüzü olsun, sağlayıcı değiştirilebilsin.

**Kullanım senaryosu B: danışan eğitmene platform üzerinden öder (V2+)**
- **iyzico Pazaryeri** bireysel, şahıs şirketi ve Ltd tipinde alt üyeleri API ile kaydedebiliyor. Ödeme alt üyeye ve bize (komisyon) bölünüyor.
- Pazaryeri ürünü genelde kurulu bir şirket (muhtemelen Ltd) bekliyor. Faz 2'de planlanmalı. PayTR'nin de pazaryeri ürünü var.
- **Dikkat:** Türkiye'de eğitmenlerin çoğu havale veya nakit alıyor. Bu özellik ilk etapta öncelik değil.

### 9.4 Bildirim altyapısı
| Kanal | Maliyet | Not |
|---|---|---|
| **`wa.me` linkleri (MVP)** | 0 | Eğitmen tek tıkla hazır mesaj gönderir. Onay veya şirket gerekmez |
| **WhatsApp Cloud API** | Utility mesaj ~0,0009 $, marketing ~0,0109 $ (Türkiye) | 1 Temmuz 2025'ten beri şablon mesaj başına ücret. **1 Ekim 2026'dan itibaren** 24 saat penceresindeki utility şablonlar da ücretli, servis mesajlarında aylık 1.000 ücretsiz. Meta Business doğrulaması gerekiyor, şirketle daha kolay |
| **SMS** | İleti Merkezi ~0,08 TL/SMS, Netgsm 1.000 SMS 899 TL | Gönderici adı (başlık) için genelde şirket gerekir |
| **E-posta (Resend)** | 3.000/ay ücretsiz | Günlük 100 limiti var |
| **Web push** | 0 | Eğitmen PWA'yı ana ekrana eklemeli |

### 9.5 Tahmini aylık maliyet (USD)
Varsayım: trainer başına ~20 danışan ve ayda ~80 WhatsApp hatırlatması.

| Kalem | Beta (0–50 trainer) | 100 trainer | 1.000 trainer |
|---|---|---|---|
| Supabase | 0 (free; 7 gün hareketsizlikte uyur, keep-alive cron) | 25 | 25–75 |
| Hosting | 0 | 5–20 | 5–60 |
| WhatsApp API | 0 (wa.me) | ~7 | ~72 |
| SMS (OTP ve yedek) | 0 | ~10 | ~50–80 |
| E-posta | 0 | 0–20 | 20 |
| Sentry / PostHog | 0 | 0 | 0–26 |
| Alan adı | ~1 | ~1 | ~1 |
| Paraşüt e-arşiv | — | ~15–25 | ~25–40 |
| **Toplam** | **~0–10 $** | **~65–110 $** | **~200–350 $** |

Ödeme komisyonları bunlara dahil değil (~%2–4,5). 1.000 eğitmen × 300 TL = 300.000 TL/ay gelirle altyapı maliyeti gelirin çok küçük bir kısmı.

### 9.6 Taşınabilirlik ilkeleri
- Postgres + Drizzle migration'ları kullanılacak. Self-host Supabase, Neon veya Türkiye'de bir VPS'e taşınabilir.
- Supabase'e özel özellikler (Realtime vb.) çekirdek mantığa girmeyecek. Auth ince bir adaptör arkasında tutulacak.
- Deploy taşınabilir kalacak: OpenNext veya Docker `next start` (Hetzner / Coolify / yerel sağlayıcı).
- Ödeme `PaymentProvider`, mesajlaşma `MessageProvider` arayüzleri arkasında olacak.

---

## 10. Riskler ve Önlemler

| Risk | Olasılık | Önlem |
|---|---|---|
| Eğitmenler "Excel yeterli" der, alışkanlığı bırakmaz | Yüksek | Onboarding'i kendin yap (Excel içe aktarma). Yoklama Excel'den hızlı olsun. Danışan portalı "vay" etkisi yaratsın |
| Danışanlar linki kullanmaz | Orta | Portal sadece bonus. Asıl değer eğitmen tarafında. WhatsApp mesajlarına link ekle |
| NetFit veya piSEANS aynı yöne gider | Orta | Hız ve tasarım farkı. Kurucu eğitmen topluluğu ile yakın ilişki |
| KVKK ihlali veya şikayeti | Düşük–orta | Sağlık verisi opsiyonel ve rızalı. Silme özelliği. Ücretli dönemden önce avukat görüşü |
| Ödeme istekliliği düşük | Orta | Betada ödeme niyetini ölç. Kurucu indirimi. Aylık fiyat bir dersin fiyatından düşük |
| Solo geliştirici kapasitesi | Yüksek | MVP kapsamına sadık kal (bölüm 6.1). Programlama ve beslenme modüllerinden uzak dur |
| Supabase free planın uyuması | Düşük | Keep-alive cron. Gerçek kullanıcılar başlayınca Pro (25 $) |

---

## 11. Sonraki Adımlar
1. Ürün adı ve alan adı seçimi
2. MVP veri modeli ve ekran akışlarının (wireframe) netleştirilmesi
3. Proje iskeleti: Next.js + Supabase + shadcn + PWA
4. İlk sprint: Auth → Danışanlar → Paket şablonları → Paket atama → Takvim → Yoklama
5. Paralel olarak Instagram'da 30–50 eğitmenlik liste ve ilk problem görüşmeleri

---

## Kaynaklar (seçme)
**Global:** trainerize.com/pricing · truecoach.co/pricing · ptdistinction.com/pricing · everfit.io/pricing · mypthub.net/pricing · trainheroic.com/pricing · harbiz.io/en/pricing · glofox.com/plans · mindbodyonline.com/business/pricing · zenplanner.com/pricing · gymdesk.com/pricing · vagaro.com/pro/pricing · calendly.com/pricing · acuityscheduling.com · arketa.com/pricing · marianatek.com · fitune.io · vibefam.com (Momence, Mindbody, Arketa incelemeleri; rakip kaynak, taraflı olabilir) · pilatesbridge.com · trainerverdict.com · capterra.com

**Türkiye:** netfitapp.com · ptwith.app · pirus.tr · gymkod.com · plan4m.com · bulutgym.com · pilatesrehberi.com/2026-pilates-raporu · armut.com/fiyatlari/personal-trainer_115 · satyayogapilates.com (2026 fiyat rehberi) · turkishminute.com (TÜİK 2025 internet kullanımı) · kvkk.gov.tr (Karar 2019/81, 2022/1357, Yurt Dışına Aktarım Rehberi, Özel Nitelikli Veri Rehberi) · mukellef.co · parasut.com · emalimusavir.com · iys.org.tr/iys/sss

**Teknik:** supabase.com/docs · vercel.com/docs/plans/hobby · developers.cloudflare.com/workers/platform/pricing · opennext.js.org/cloudflare · fullcalendar.io/pricing · schedule-x.dev/premium · developers.facebook.com (WhatsApp pricing) · iyzico.com/destek · docs.iyzico.com/urunler/pazaryeri · paytr.com/en/subscription-method · ceaksan.com (Türkiye ödeme altyapıları) · iletimerkezi.com · netgsm.com.tr · resend.com/pricing · sentry.io/pricing
