import { APP_DESCRIPTION, APP_NAME, siteUrl } from "@/lib/config";
import { GUIDES } from "@/lib/guides";
import { LEGAL } from "@/lib/legal";

// A plain summary for AI assistants (llms.txt). Google ignores it; it costs nothing.
export const dynamic = "force-static";

export function GET() {
  const base = siteUrl();
  const text = `# ${APP_NAME}

> ${APP_DESCRIPTION} Türkiye'deki stüdyolar için bir web uygulaması; danışanlar bir şey indirmez. Beta süresince ücretsiz.

${APP_NAME} ile stüdyo sahibi eğitmen ekibini, ortak takvimi, danışanları, seans paketlerini, yoklamayı, ödemeleri ve eğitmen hakedişini tek yerde tutar. Her danışanın uygulama indirmeden açtığı kişisel bir sayfası olur; kalan derslerini görür, randevu alır (eğitmen seçerek ya da "Fark etmez" diyerek), dersini onaylar, antrenman programını ve ölçüm grafiklerini görür, stüdyoya mesaj yazar. Ödemeler stüdyonun IBAN'ına gider, ${APP_NAME} komisyon almaz.

## Sayfalar

- [Ana sayfa](${base}/): stüdyo yönetimi, özellikler, nasıl çalıştığı, sık sorulan sorular
- [Özellikler](${base}/ozellikler): bütün özellikler konu konu (stüdyo ve ekip, randevu, paket ve ödeme, danışanın sayfası, stüdyo sayfası, antrenman ve beslenme, gelişim, mesaj, veriler)
- [Pilates stüdyoları](${base}/pilates-egitmenleri): reformer ve mat; paket, telafi hakkı, kontenjan, eğitmen takvimi ve hakediş, ev programı
- [PT stüdyoları](${base}/personal-trainer): PT paketi, eğitmenler ve randevu, antrenman programı, ölçüm ve beslenme planı
- [Fiyatlar](${base}/fiyatlar): beta süresince ücretsiz; ücretli plana geçmeden en az bir hafta önce haber, beta'da kayıt olanlara 6 ay ücretsiz; eğitmen eklemek için ayrı ücret yok
- [Rehber](${base}/rehber): pilates ve PT stüdyoları için pratik yazılar
${GUIDES.map((g) => `  - [${g.title}](${base}/rehber/${g.slug})`).join("\n")}
- [KVKK aydınlatma metni](${base}/kvkk): hangi veriler, neden ve nerede işleniyor
- [Sağlık verileri açık rıza metni](${base}/acik-riza)
- [Kullanım koşulları](${base}/kosullar)

## Öne çıkanlar

- Stüdyo ekibi: sahip eğitmenleri ekler, isterse e-postayla giriş daveti gönderir (giriş yapmayan eğitmenin derslerini sahip yönetir). Eğitmen kendi derslerini, yoklamayı, ders notlarını ve programları görür; ödemeleri, fiyatları, paket ve stüdyo ayarlarını görmez. Sahip her eğitmen için ayrı yetki verir: bütün danışanları görme, danışan ekleme/düzenleme, kendi derslerini planlama, çalışma saatlerini düzenleme, kendi program şablonlarını oluşturma, herkesin şablonlarını düzenleme, diğer eğitmenlerin derslerini görme.
- Ortak takvim: her dersin ve grup dersinin bir eğitmeni var, eğitmen başına renk ve filtre; çakışmaya eğitmen bazında bakılır. Ders ya da seri başka eğitmene devredilebilir, danışanlara bildirilir.
- Eğitmen başına çalışma saatleri ve izin günleri; danışan randevu alırken eğitmen seçer ya da "Fark etmez" der. Seans paketi belirli eğitmenlerle sınırlanabilir.
- Hakediş: ders türüne göre (özel, düet, trio, grup) ders başına sabit ücret ya da dersin değerinden yüzde; aylık görünüm, ay kapatma, ödendi işareti, Excel. Eğitmen yalnızca kendi hakedişini görür.
- Yoklama: geldi, gelmedi, geç iptal; kalan ders kendiliğinden düşer, telafi hakkı işlenir.
- Seans paketleri: peşin, taksitli ve indirimli fiyat; deneme dersi; paket biterken yenileme teklifi.
- Dersten önce "Geliyor musun?" hatırlatması ve tek dokunuşla onay.
- Herkese açık stüdyo sayfası (tanıtım, ekip, paketler) ve online kayıt formu; grup derslerinde kontenjan ve sabit yer. Birden fazla hesapta olan eğitmen hesaplar arasında geçiş yapar.
- Antrenman programı: 200'den fazla hazır hareket (makine, serbest ağırlık, reformer, mat), her harekette vücut haritasında ana ve yardımcı kaslar, şablondan kopyalama, set/tekrar/ağırlık, danışanın "yaptım" işareti.
- Ölçüm takibi: kilo, kas, yağ oranı, çevre ölçüleri; danışanın sayfasında gelişim grafikleri; periyodik ölçüm hatırlatması.
- Beslenme planı: öğün öğün öneriler, günlük hedefler; kalori hesabı ve diyet listesi yok.
- Programlar ve beslenme planları yazdırılabilir ya da PDF olarak kaydedilebilir.
- Ders notları ve sağlık uyarısı; taksit hatırlatması; hatırlatma ve hazır mesaj metinleri stüdyonun kendi cümleleriyle.
- Excel'den danışan aktarma ve bütün verileri Excel olarak indirme.
- Şu an yok: resepsiyon rolü, salon ya da reformer planlaması, kartla online tahsilat, birden fazla şube.
- Veriler Frankfurt'taki (AB) sunucularda; sağlık bilgisi yalnızca açık rızayla.

## İletişim

${LEGAL.email}
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
