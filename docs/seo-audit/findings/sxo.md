# SXO (Arama Deneyimi) Bulguları: studyomapp.com

- Tarih: 2026-09-30
- Hedef URL: https://studyomapp.com/ (kaynak: `src/app/page.tsx`)
- Yöntem: `render_page.py --mode always` (Playwright, SPA değil, HTTP 200), `parse_html.py`, 14 WebSearch sorgusu, 5 rakip sayfası incelendi
- **SXO Gap Score: 53/100** (SEO Sağlık Skorundan ayrı bir skordur)

---

## 1. Ana bulgu: sayfa türü uyumsuzluğu (ORTA, yapısal olarak YÜKSEK)

Asıl sorun metin kalitesi değil, sayfa sayısı. Stüdyom tek bir genel **Landing Page** ile hem "pilates stüdyo yönetim programı" hem "personal trainer uygulaması" hem de "pilates randevu sistemi" niyetini karşılamaya çalışıyor. Bu SERP'lerde ise şu sayfa türleri kazanıyor:

1. **Sektöre özel Hybrid sayfalar** (ürün ve içerik bir arada): tek bir niş için yazılmış, 1.400 ile 3.000 kelime arası, gereksinim tablosu, fiyat, 10'dan fazla soruluk SSS ve müşteri logoları içeren sayfalar. Örnekler: `gymkod.com/pilates-studyo-yazilimi`, `gymtekno.com/tr/pilates-reformer-salonlari`, `bulutgym.com/studyo-ders-yonetimi.html`, `clinyo.com/randevu-programi/pilates-salonu`, `pirus.tr/pilates-ve-yoga-studyolari-icin-randevu-ve-uye-takip-sistemi`.
2. **Karşılaştırma ve dizin sayfaları**: Capterra ("En İyi Pilates Stüdyosu Yazılımı", "En İyi Ücretsiz Personal Trainer Uygulaması").
3. **Uygulama mağazası kayıtları** (PT sorgularında): App Store ve Google Play.

Stüdyom'da bunların hiçbiri yok. Pilates'e özel bir sayfa, PT'ye özel bir sayfa, fiyat sayfası, karşılaştırma sayfası ve blog/rehber bulunmuyor. Sitemap'te yalnızca `/`, `/kvkk`, `/acik-riza`, `/kosullar` ve eğitmen sayfaları var.

| Sorgu | SERP'te baskın tür (güven) | Stüdyom'un türü | Uyumsuzluk |
|---|---|---|---|
| pilates stüdyo yönetim programı | Satıcı sayfaları %89 (8/9). Bunların 5/9'u sektöre özel Hybrid, 3/9'u ana sayfa | Genel Landing | **ORTA**: sayfa türü yakın ama pilates'e özel derinlik yok |
| pilates stüdyo programı | Karışık niyet: egzersiz programı/uygulaması 4/9, yazılım 3/9, yerel stüdyo 2/9 | Landing | **ORTA**: belirsiz bir sorgu, ana hedef olmamalı |
| personal trainer uygulaması | Uygulama mağazası 2/9, Capterra 2/9, Wikipedia 3/9, yabancı SaaS 2/9 | Landing | **YÜKSEK**: mağaza kaydı ve karşılaştırma yok, PT'ye özel sayfa yok |
| personal trainer uygulaması danışan takibi | Satıcı sayfası 5/10, blog/forum 4/10 (Hybrid) | Landing | **ORTA** |
| danışan takip programı | Diyetisyen/klinik yazılımları 9/9 | Landing | **KRİTİK (dikey uyumsuzluk)**: Google bu terimi diyetisyen ve sağlık alanı olarak yorumluyor |
| seans takip programı | Dikey sektör sayfaları (spor salonu, psikolog, lazer, güzellik) 8/10 | Landing | **YÜKSEK**: niteleyici olmadan kazanılamaz |
| pilates randevu sistemi | Satıcı sektör sayfası 3/10, stüdyoların kendi randevu sayfaları 3/10, genel 4/10 | Landing | **ORTA**. Fırsat: eğitmen sayfaları (`/[slug]`) bu türe uyuyor |
| spor salonu üye takip programı | Turnike, biyometrik ve salon yazılımı 9/9 | Landing | **KRİTİK (kitle uyumsuzluğu)**: hedeflenmemeli |

**Sonuç:** Ana sayfa marka ve dönüşüm sayfası olarak kalmalı. Ticari sorgular için ayrı sayfalar açılmalı (Bölüm 6). Anahtar kelimeler de değiştirilmeli: "danışan takip programı" yerine "pilates danışan takip programı", "seans takip programı" yerine "seans paketi takip programı".

---

## 2. Hedef sayfanın durumu (render edilmiş DOM)

| Öğe | Değer |
|---|---|
| Title | `Stüdyom · Pilates ve PT için Danışan ve Seans Takibi` (51 karakter, iyi) |
| Meta description | "Pilates ve PT eğitmenleri için danışan takip programı…" (160 karakter, anahtar kelime içeriyor) |
| H1 | "Defteri bırakın. Danışan ve seans takibini Stüdyom yapsın." Duygusal ve güçlü bir cümle ama "pilates", "program", "yazılım" gibi hiçbir ticari terim içermiyor. |
| H2 (6) | Özellikler / Kart gerekmez / Üç adım / Neden Stüdyom / SSS / Kapanış CTA'sı. Hepsi slogan cümlesi; hiçbiri sorgu diliyle yazılmamış. |
| H3 (21) | Özellik başlıkları somut (yoklama, telafi, 24 saat kuralı, taksit, IBAN/dekont, Excel aktarımı) |
| Kelime sayısı | 1.078 (rakip sektör sayfaları 1.400 ile 3.000 arası) |
| Schema | SoftwareApplication (Offer 0 TRY) + FAQPage (7 soru). Organization/WebSite yok. |
| Görseller | **Hiç `<img>` yok.** Demolar `aria-hidden` HTML bileşenleri ve telefon mockup'ı. Gerçek ekran görüntüsü ve video yok. OG görseli var. |
| Linkler | 9 iç link (çoğu anchor ya da `/giris`), 0 dış link |
| CTA | "Ücretsiz başlayın" üç yerde (menü, hero, kapanış), ikincil CTA "Nasıl çalışıyor?". Katılık yok ve güçlü. |
| Güven | Kullanıcı sayısı, yorum, logo, kurucu/hakkımızda bilgisi yok. Beta'dan sonra fiyatın ne olacağı belirsiz. |
| Tazelik | Tarih yok, blog yok |
| Marka görünürlüğü | "Stüdyom studyomapp" aramasında site çıkmıyor (indeks ya da marka sinyali zayıf) |

---

## 3. SERP sinyalleri ve rakip kalıpları

**Rakipler (Türkiye):** BulutGym (520 merkez, 500.000 üye iddiası), GymKod Pro (1.000 TL + KDV/ay, "ilk 3 ay ücretsiz", 14 stüdyo logosu), Gymtekno/Doregym, Pirus/piSEANS (PT ve psikolog blog içerikleri), Plan4M, PilatesYap, Carbon Yazılım, Clinyo, Beeasist (pilates eğitmenlerine özel sayfa), GymPro (PT takip), NetFit (Ücretsiz / 690 TL / 1.290 TL paketleri, marketplace), Merkezim (599 ile 1.499 TL/ay, 1 hafta deneme, 9 sektör sayfası; incelenen sorgularda üst sıralarda görünmedi).
**Global/dizin:** Capterra (TR ve EN), TrueCoach, My PT Hub.

Tekrarlanan kalıplar:
- **Sektöre özel URL ve H1**: "Pilates Stüdyo Yazılımı: Randevu, Paket ve Eğitmen Takibi Dağılmasın" (GymKod), "Pilates & Reformer stüdyolarında yönetim programı" (Gymtekno)
- **Fiyat şeffaflığı**: GymKod, NetFit ve Merkezim TL fiyatlarını sayfada gösteriyor. Capterra'da "ücretsiz" filtresi var.
- **Sosyal kanıt**: logo duvarı (GymKod), büyük sayılar (BulutGym)
- **Gereksinim/karşılaştırma tablosu**: GymKod'da "Pilates stüdyo yazılımında olması gerekenler" (11 kriter), "Neden genel randevu programı yeterli olmaz?"
- **Excel/defterden geçiş anlatısı**: BulutGym blogu ("kağıt üzerinde veya Excel tablolarında … hataya açık")
- **Üye mobil uygulaması**: çoğu rakip mağazada markalı üye uygulaması yayınlıyor (Google Play'de "ELF PILATES", "N.S.PILATES Üye Uygulaması")
- **PT SERP'i**: ölçüm, postür analizi, beslenme ve antrenman programı beklentisi var (PT Pro, FitSW, Online Personal Training)

---

## 4. Kullanıcı hikayeleri (SERP sinyaline dayalı)

1. **Farkındalık.** Bir *bireysel reformer pilates eğitmeni* olarak kalan seansları defter ve WhatsApp yerine telefondan takip etmek istiyorum, çünkü kimin kaç dersi kaldığını karıştırmak danışanla arama sorun çıkarıyor. Ama önüme çıkan programlar "stüdyo/salon" için yapılmış, turnikeli ve çok şubeli; bana göre olmadıklarını düşünüyorum.
   *Sinyal: "spor salonu üye takip programı" SERP'inin 9/9 turnike/biyometrik olması; "pilates stüdyo yönetim programı" sonuçlarında "eğitmen prim", "çoklu lokasyon" vurgusu (GymKod, Pirus); "bireysel pilates eğitmeni…" sorgusuna bireysel eğitmene özel hiçbir satıcı sayfasının çıkmaması.*
2. **Değerlendirme.** Bir *fiyat karşılaştıran eğitmen* olarak aylık ne ödeyeceğimi baştan bilmek istiyorum, çünkü 10 ile 20 danışanlı bir işte 1.000 TL/ay pahalı. Ama Stüdyom'da "beta boyunca ücretsiz" dışında beta'dan sonra ne olacağı yazmıyor; ileride fiyat şoku yaşamaktan çekiniyorum.
   *Sinyal: GymKod "1.000 TL + KDV", NetFit "0 / 690 / 1.290 TL", Merkezim "599,40 TL", Capterra "En İyi Ücretsiz Personal Trainer Uygulaması" sonuçları.*
3. **Değerlendirme.** Bir *personal trainer* olarak danışanımın paketini, ödemesini ve gelişimini tek yerde görmek istiyorum, çünkü işimi profesyonel göstermek istiyorum. Ama Stüdyom sayfası PT'ye özel bir şey söylemiyor: ölçüm, antrenman programı ya da gelişim takibi var mı, belli değil.
   *Sinyal: Pirus "Personal Trainer için Danışan Yönetimi" (seans notları, gelişim takibi), PT Pro (ölçüm, postür, beslenme), App Store sonuçları.*
4. **Karar.** Bir *Excel ya da defterden geçen eğitmen* olarak mevcut listemi kaybetmeden taşımak istiyorum, çünkü yeniden girmeye vaktim yok. Ama tanımadığım bir girişime verimi emanet etmekten çekiniyorum, çünkü kimlerin kullandığını ve arkasında kimin olduğunu göremiyorum.
   *Sinyal: BulutGym'in Excel'den geçiş anlatısı; GymKod'un 14 stüdyo logosu ve BulutGym'in "520 merkez" sosyal kanıtı; marka aramasında sitenin çıkmaması.*
5. **Karar.** Bir *butik stüdyo sahibi* olarak 2 ile 4 eğitmenimin derslerini ve primlerini takip etmek istiyorum. Ama Stüdyom'un tek eğitmen hesabıyla çalıştığını ancak kaydolduktan sonra fark ediyorum.
   *Sinyal: GymKod "eğitmen prim", Plan4M "eğitmen takibi", Pirus "Personel ve Çoklu Lokasyon Yönetimi". Veri modelinde eğitmen/personel tablosu yok (`src/db/schema.ts`: yalnızca `trainers`).*

---

## 5. Boşluk analizi (SXO Gap Score: 53/100)

| Boyut | Puan | Kanıt |
|---|---|---|
| Sayfa türü | 8/15 | Ticari SERP'lerde sektöre özel Hybrid sayfa kazanıyor; bizde tek bir genel Landing var. "danışan/seans takip programı" terimleri dikey olarak uyumsuz. |
| İçerik derinliği | 8/15 | 1.078 kelime (GymKod ~2.200, BulutGym ~2.500+). Gereksinim tablosu, "stüdyo yazılımı mı eğitmen programı mı" bölümü ve PT'ye özel içerik yok. |
| UX sinyalleri | 12/15 | Katılıksız CTA ekranın ilk görünümünde, ikincil CTA var, anchor menü, SSS akordeonu ve 3 adım var. Fiyat bölümü ve gerçek ürün görüntüsü eksik. |
| Schema | 11/15 | SoftwareApplication + Offer + FAQPage geçerli. Organization/WebSite, `featureList`, `screenshot` yok. FAQPage zengin sonucu 2023'ten beri kısıtlı; AI ve özet görünürlüğü için tutulmalı. |
| Medya | 7/15 | 0 `<img>`, video yok. Demolar erişilebilirlik ağacından gizli (`aria-hidden`); Google Görseller ve AI özetleri için içerik taşımıyor. |
| Otorite | 3/15 | Yorum, kullanıcı sayısı, logo, kurucu hikayesi ve basın yok; marka indeksi zayıf. KVKK ve açık rıza sayfaları var (tek artı). |
| Tazelik | 4/10 | Tarih, sürüm notu ve blog yok. Sitemap'te `lastModified` yalnızca eğitmen sayfalarında var. |
| **Toplam** | **53/100** | |

---

## 6. Persona skorları

| Persona | Relevance | Clarity | Trust | Action | Toplam | Değerlendirme |
|---|---|---|---|---|---|---|
| Butik stüdyo sahibi (2-4 eğitmen) | 9 | 12 | 6 | 12 | **39** | Kritik uyumsuzluk |
| Personal trainer (serbest PT) | 14 | 15 | 7 | 18 | **54** | Geliştirilmeli |
| Fiyat karşılaştıran eğitmen | 15 | 14 | 8 | 20 | **57** | Geliştirilmeli |
| KVKK/sağlık verisi konusunda hassas eğitmen | 18 | 16 | 13 | 17 | **64** | İyi |
| Bireysel reformer/mat pilates eğitmeni | 22 | 20 | 9 | 20 | **71** | İyi |
| Excel/defterden geçen, teknolojiye mesafeli eğitmen | 22 | 20 | 12 | 20 | **74** | İyi |

Öneriler en zayıf personadan başlayarak sıralandı.

1. **Butik stüdyo sahibi (39).** Ürün bu kişiye şu an hizmet etmiyor (çoklu eğitmen yok). Bu kitleyi hedeflemek yerine konumlandırmayı netleştirin. Ana sayfaya ve pilates sayfasına "Kimler için?" bloğu ekleyin: "Tek başına ya da küçük bir stüdyoda ders veren eğitmenler için. Birden çok eğitmenli stüdyo yönetimi yol haritasında." Aksi halde yanlış kitle kaydolup hemen çıkar. Çoklu eğitmen gelince `/pilates-studyo-yazilimi` açılmalı.
2. **Personal trainer (54).** `/personal-trainer` sayfası açın (Bölüm 7). Ölçüm, antrenman programı ve beslenme takibi yoksa açıkça yazın ("Antrenman programı yazmıyoruz; paket, randevu ve ödeme işinizi üstleniyoruz"), çünkü SERP bu beklentiyi taşıyor. Hero altına PT'ye özel örnek ekleyin: "10 derslik PT paketi, 2 taksit".
3. **Fiyat karşılaştıran (57).** `/fiyatlar` sayfası açın ("fiyatlar" zaten RESERVED listesinde). İçinde beta'dan sonraki fiyat taahhüdü olsun ("Beta'da katılanlara X ay ücretsiz / kurucu fiyatı", "Ücretli olacaksa 30 gün önceden haber veririz"), ayrıca "Komisyon almıyoruz, ödeme IBAN'ınıza gelir" vurgusu. Ana sayfaya kısa bir fiyat bölümü ekleyin.
4. **Otorite (tüm personalarda en zayıf boyut, Trust ortalaması 9,2/25).** Beta kullanıcılarından 3 ile 5 alıntı (isim, şehir, ders türü, izinli fotoğraf), "X eğitmen / Y ders takip edildi" sayacı (gerçek veriyle, `/yonetim` metriklerinden), kurucu notu ve `/hakkimizda` sayfası (reserved), gerçek ürün ekran görüntüleri (`<img>` + Türkçe alt metin) ve 30-60 saniyelik bir demo videosu (VideoObject).
5. **Ana sayfa H1.** Duygusal cümleyi koruyup ticari terimi H1'e alın. Örnek: H1 "Pilates ve PT eğitmenleri için danışan ve seans takip programı", üstünde eyebrow olarak "Defteri bırakın." Ya da tersi: görsel başlık aynı kalsın, H1 metnine "pilates ve PT eğitmenleri için" eklensin.

---

## 7. Açılması önerilen sayfalar

> **Teknik ön koşul:** Eğitmen sayfaları kökte (`/[slug]`) yaşıyor. Aşağıdaki slug'lar `src/lib/slug.ts` içindeki `RESERVED` listesine eklenmeli ve canlı veritabanında bu slug'ları kullanan eğitmen olmadığı kontrol edilmeli: `pilates`, `pilates-egitmenleri`, `personal-trainer`, `online-randevu`, `seans-paketi-takibi`, `karsilastirma`, `alternatif`, `rehber`, `blog`, `ozellikler`, `sablonlar`. `fiyatlar`, `hakkimizda` ve `yardim` zaten listede. Yeni sayfalar `sitemap.ts`'e eklenmeli ve her biri için `lastModified` verilmeli. (Bu dokümanda kod değiştirilmedi.)

### Öncelik 1: Pilates eğitmenleri sayfası
- **URL:** `/pilates-egitmenleri`
- **Hedef KW:** "pilates eğitmeni danışan takip programı", "reformer pilates seans paketi takibi", ikincil olarak "pilates stüdyo yönetim programı" (butik/tek eğitmen)
- **Title:** `Pilates Eğitmenleri İçin Seans Paketi ve Yoklama Takibi | Stüdyom`
- **H1:** "Pilates eğitmenleri için seans paketi, yoklama ve randevu takip programı"
- **Taslak:**
  1. Hero: "Reformer, mat ya da düet; kalan seans yoklamayla otomatik düşsün" + CTA "Ücretsiz başlayın" + gerçek ekran görüntüsü
  2. "Kimler için?" (tek başına ders veren, stüdyo kiralayan ya da evde ders veren eğitmen; çoklu eğitmen henüz yok)
  3. Pilates'e özgü akış: özel/düet/grup paketleri, telafi hakkı, 24 saat iptal kuralı, dondurma (`packageFreezes`), reformer kontenjanı ve sabit yer
  4. "Pilates programında olması gerekenler" tablosu (GymKod'un 11 kriterlik tablosuna karşılık: kriter, Stüdyom'da nasıl, ayrıca dürüst "yok" satırları)
  5. "Genel randevu programı neden yetmez?" (kalan seans, telafi, paket yenileme)
  6. Instagram bio sayfası: canlı örnek eğitmen sayfasına link (izinli)
  7. Excel'den geçiş (3 adım + örnek CSV)
  8. Fiyat özeti ve `/fiyatlar` linki
  9. SSS (8-10 soru: "Reformer kontenjanı nasıl ayarlanır?", "Telafi hakkı nasıl işler?", "Danışan uygulama indirir mi?")
  10. Kapanış CTA'sı
- **Schema:** SoftwareApplication (`audience`: pilates eğitmenleri), BreadcrumbList, FAQPage

### Öncelik 1: Personal trainer sayfası
- **URL:** `/personal-trainer`
- **Hedef KW:** "personal trainer uygulaması", "personal trainer danışan takibi", "PT paket takibi"
- **Title:** `Personal Trainer Uygulaması: Danışan, Paket ve Ödeme Takibi | Stüdyom`
- **H1:** "Personal trainer'lar için danışan, PT paketi ve ödeme takibi"
- **Taslak:**
  1. Hero: "10 derslik PT paketinden kaç ders kaldı, kim ne kadar ödedi; telefonda" + CTA
  2. Salonda ders veren serbest PT senaryosu (salon programı üyeyi tutar, PT'nin kendi danışanı ve tahsilatı ise ayrı kalır)
  3. PT paketleri, taksit, peşin/indirim, deneme dersi
  4. Danışanın kendi randevusunu alması (çalışma saatleri, iptal kuralı)
  5. Mesajlaşma: kişisel numara yerine uygulama
  6. "Stüdyom ne yapmaz?" (antrenman programı, beslenme, ölçüm; varsa yol haritası). Bu SERP beklentisini dürüstçe karşılar.
  7. Danışan "uygulama indirmeden" kullanır (PWA; App Store'a gerek yok, mağaza sonuçlarıyla fark buradan kurulur)
  8. SSS + CTA
- **Schema:** SoftwareApplication, BreadcrumbList, FAQPage

### Öncelik 1: Fiyatlar
- **URL:** `/fiyatlar` (reserved)
- **Hedef KW:** "pilates stüdyo programı fiyatları", "personal trainer uygulaması ücretsiz", "eğitmen takip programı fiyat"
- **H1:** "Stüdyom fiyatları: Beta süresince ücretsiz"
- **Taslak:** beta planı ve kapsamı, beta sonrası taahhüt ve tarih, "komisyon yok / ödeme IBAN'ınıza", limitler (danışan sayısı sınırı var mı), kart gerekmez, "verinizi Excel olarak her zaman indirin" (kilitlenme endişesine karşı), SSS
- **Schema:** SoftwareApplication + Offer (`priceValidUntil` ya da açıklama)

### Öncelik 2: Karşılaştırma merkezi ve "alternatif" sayfaları
- **URL:** `/karsilastirma` (merkez) + `/karsilastirma/bulutgym-alternatifi`, `/karsilastirma/gymkod-alternatifi`, `/karsilastirma/netfit-alternatifi`, `/karsilastirma/merkezim-alternatifi`
- **Hedef KW:** "pilates stüdyo yazılımları karşılaştırma", "en iyi pilates stüdyo programı", "[rakip] alternatifi"
- **Merkez H1:** "Pilates ve PT eğitmenleri için takip programları karşılaştırması (2026)"
- **Taslak:** karşılaştırma kriterleri (tek eğitmen/stüdyo odağı, aylık TL fiyat, deneme süresi, danışan uygulaması gerekli mi, IBAN/komisyon, telafi/24 saat kuralı, Excel aktarımı, KVKK açık rıza), tablo (ItemList), her aracın kısa değerlendirmesi ve "kime uygun", dürüst sonuç ("çok şubeli salonsanız BulutGym/GymKod; tek başınıza ders veriyorsanız Stüdyom"), güncelleme tarihi, kaynak linkleri
- **Not:** Rakip fiyatlarını tarih ve kaynakla verin (örnek: GymKod 1.000 TL + KDV/ay, NetFit 0/690/1.290 TL, Merkezim 599,40 TL'den başlayan; 2026-09 itibarıyla). Karalayıcı ifade kullanmayın.

### Öncelik 2: Online randevu (özellik sayfası)
- **URL:** `/online-randevu`
- **Hedef KW:** "pilates randevu sistemi", "pilates online randevu", "ders randevu linki"
- **H1:** "Pilates ve PT dersleri için online randevu sistemi: Danışan boş saati kendisi seçsin"
- **Taslak:** çalışma saatleri ve izinler (`availabilityRules`, `timeOff`), çakışma önleme, iptal kuralı, hatırlatma ve "Geliyor musun?", grup dersine yazılma, canlı örnek sayfa, Instagram bio kullanımı, SSS
- **Ek fırsat:** "pilates randevu sistemi" SERP'inde stüdyoların kendi randevu sayfaları da sıralanıyor (bipilates, thepilatesplus, pilatessim). Eğitmen sayfaları (`/[slug]`) için title kalıbı "[Eğitmen adı] Pilates · Online Randevu ve Paketler · [Şehir]" olmalı; SportsActivityLocation schema'sına `address`/`areaServed` eklenmeli. (Yerel boyut için `/seo local` önerilir.)

### Öncelik 3: Araç/şablon sayfası (farkındalık aşaması için mıknatıs)
- **URL:** `/sablonlar/seans-paketi-takip-tablosu`
- **Hedef KW:** "seans takip tablosu excel", "pilates seans takip formu", "kalan seans takibi"
- **H1:** "Ücretsiz seans paketi takip tablosu (Excel şablonu)"
- **Taslak:** indirilebilir XLSX (Stüdyom içe aktarma formatıyla birebir aynı sütunlar), kullanım adımları, "tablo büyüyünce ne olur" bölümü ve tek tıkla içe aktarma CTA'sı. Türü: Tool/Interactive. "seans takip programı" gibi çok dikeyli terimlere niş bir giriş kapısı sağlar.

### Öncelik 3: Rehber içerikleri (blog)
- `/rehber/telafi-ve-iptal-kurali` · KW "pilates iptal kuralı", "telafi dersi kuralı" · H1 "Pilates derslerinde telafi hakkı ve 24 saat iptal kuralı nasıl yazılır?" (+ kopyalanabilir kural metni)
- `/rehber/pilates-egitmeni-danisan-bulma` · KW "pilates eğitmeni danışan nasıl bulur" · H1 "Pilates eğitmeni olarak Instagram'dan danışan bulmak: bio linkinden kayda"
- `/rehber/pilates-paket-fiyatlandirma` · KW "pilates paket fiyatları nasıl belirlenir" · H1 "Özel, düet ve grup pilates paketlerini nasıl fiyatlandırırsınız?" (SERP'te "8-12 seanslık paketlerde %15-25 indirim" gibi veriler var)
- `/rehber/kvkk-saglik-bilgisi-pilates` · KW "pilates sağlık formu kvkk" · H1 "Danışandan sağlık bilgisi alırken KVKK: açık rıza nasıl alınır?"
- Her birinde Article schema, yazar (kurucu), tarih ve ilgili ürün sayfasına bağlam içi link

### Hedeflenmemesi gerekenler
- **"spor salonu üye takip programı"**: SERP turnike, biyometrik ve çok şubeli salon yazılımları. Kitle uyuşmuyor.
- **Tek başına "danışan takip programı" ve "seans takip programı"**: Google bu terimleri diyetisyen, psikolog ve güzellik alanı olarak yorumluyor. Yalnızca "pilates/PT" niteleyicisiyle hedefleyin. Ana sayfanın meta description'ındaki "danışan takip programı" ifadesini "pilates ve PT danışan takip programı" olarak bırakmak yeterli.

---

## 8. Ana sayfa için hızlı kazanımlar (kod değiştirilmedi, öneri)
1. H1'e ticari terimi alın (Bölüm 6, madde 5).
2. Hero'nun altına "Pilates eğitmenleri için →" ve "Personal trainer'lar için →" segment kartları koyun (iç link + niyet ayrımı).
3. Kısa bir fiyat bölümü ve beta sonrası taahhüt ekleyin.
4. Sosyal kanıt bandı ekleyin (gerçek beta eğitmen alıntıları ve sayılar).
5. Gerçek ekran görüntülerini `<img>` + Türkçe alt metinle koyun ve bir demo videosu ekleyin.
6. Footer'a ürün sayfaları, karşılaştırma ve rehber linklerini koyun (şu an yalnızca yasal sayfalar ve giriş var).
7. Organization + WebSite schema ekleyin (şema üretimi için `/seo schema`).

---

## 9. Kısıtlar
- WebSearch Google.com.tr'nin birebir karşılığı değil. Konum ve kişiselleştirme yok, sıralamalar yaklaşık. **PAA, reklamlar, AI Overview, yerel paket ve öne çıkan snippet gözlemlenemedi.** Kullanıcı hikayeleri bu yüzden PAA yerine sonuç başlıkları, snippet'ler ve rakip sayfa yapıları üzerinden türetildi.
- Arama hacmi verisi yok (Keyword Planner/DataForSEO kullanılmadı), persona ağırlıkları nitel.
- pilatesyap.com HTTP 503 döndü ve incelenemedi. Merkezim incelenen sorgularda üst sıralarda görünmedi; yalnızca ana sayfası incelendi.
- Search Console, gerçek sıralama ve CTR verisi yok. Marka indeks durumu yalnızca tek bir aramayla gözlendi.
- Core Web Vitals ve mobil render ölçülmedi (bkz. `technical.md`).
- Rakip fiyatları 2026-09-30 tarihinde görülen değerlerdir.

---

## 10. audit-data.json için yapılandırılmış bulgular (Search Experience)

```json
{
  "category": "Search Experience",
  "sxo_gap_score": 53,
  "target": { "url": "https://studyomapp.com/", "page_type": "Landing Page", "word_count": 1078, "images": 0, "schema": ["SoftwareApplication", "Offer", "FAQPage"] },
  "serp_dominant_type": { "type": "Hybrid (sektöre özel ürün+içerik)", "confidence": 0.56, "commercial_share": 0.89, "keyword": "pilates stüdyo yönetim programı" },
  "mismatch": [
    { "keyword": "pilates stüdyo yönetim programı", "severity": "MEDIUM" },
    { "keyword": "pilates stüdyo programı", "severity": "MEDIUM", "note": "karışık niyet" },
    { "keyword": "personal trainer uygulaması", "severity": "HIGH" },
    { "keyword": "personal trainer uygulaması danışan takibi", "severity": "MEDIUM" },
    { "keyword": "danışan takip programı", "severity": "CRITICAL", "note": "diyetisyen/sağlık dikeyi" },
    { "keyword": "seans takip programı", "severity": "HIGH", "note": "çok dikeyli" },
    { "keyword": "pilates randevu sistemi", "severity": "MEDIUM" },
    { "keyword": "spor salonu üye takip programı", "severity": "CRITICAL", "note": "kitle uyumsuz, hedeflenmemeli" }
  ],
  "dimension_scores": { "page_type": 8, "content_depth": 8, "ux": 12, "schema": 11, "media": 7, "authority": 3, "freshness": 4 },
  "personas": [
    { "name": "Butik stüdyo sahibi", "score": 39 },
    { "name": "Personal trainer", "score": 54 },
    { "name": "Fiyat karşılaştıran eğitmen", "score": 57 },
    { "name": "KVKK hassas eğitmen", "score": 64 },
    { "name": "Bireysel pilates eğitmeni", "score": 71 },
    { "name": "Excel/defterden geçen eğitmen", "score": 74 }
  ],
  "competitors": ["bulutgym.com", "gymkod.com", "gymtekno.com", "pirus.tr", "plan4m.com", "pilatesyap.com", "carbonyazilim.com.tr", "clinyo.com", "beeasist.com", "gympro.com", "netfitapp.com", "merkezim.com", "capterra.com"],
  "recommended_pages": [
    { "url": "/pilates-egitmenleri", "priority": 1, "keyword": "pilates eğitmeni danışan takip programı" },
    { "url": "/personal-trainer", "priority": 1, "keyword": "personal trainer uygulaması" },
    { "url": "/fiyatlar", "priority": 1, "keyword": "pilates stüdyo programı fiyatları" },
    { "url": "/karsilastirma", "priority": 2, "keyword": "pilates stüdyo yazılımları karşılaştırma" },
    { "url": "/online-randevu", "priority": 2, "keyword": "pilates randevu sistemi" },
    { "url": "/sablonlar/seans-paketi-takip-tablosu", "priority": 3, "keyword": "seans takip tablosu excel" },
    { "url": "/rehber/*", "priority": 3, "keyword": "telafi/iptal kuralı, paket fiyatlandırma, KVKK sağlık formu" }
  ],
  "prerequisite": "Yeni kök slug'lar src/lib/slug.ts RESERVED listesine eklenmeli ([slug] rotasıyla çakışma)"
}
```

Çapraz öneriler: E-E-A-T boşlukları için `/seo content`, schema üretimi için `/seo schema`, eğitmen sayfalarının yerel görünürlüğü için `/seo local`, yeni sayfalar yayınlandığında `/seo page`. PDF rapor için `/seo google report`.
