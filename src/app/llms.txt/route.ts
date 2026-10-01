import { APP_DESCRIPTION, APP_NAME, siteUrl } from "@/lib/config";
import { LEGAL } from "@/lib/legal";

// A plain summary for AI assistants (llms.txt). Google ignores it; it costs nothing.
export const dynamic = "force-static";

export function GET() {
  const base = siteUrl();
  const text = `# ${APP_NAME}

> ${APP_DESCRIPTION} Türkiye'de tek başına çalışan pilates eğitmenleri ve personal trainer'lar için web uygulaması. Beta süresince ücretsiz.

${APP_NAME} ile eğitmen danışanlarını, seans paketlerini, derslerini, yoklamayı ve ödemeleri tek yerde tutar. Her danışanın uygulama indirmeden açtığı kişisel bir sayfası olur; kalan derslerini görür, randevu alır, dersini onaylar, antrenman programını ve ölçüm grafiklerini görür, eğitmenine mesaj yazar. Ödemeler eğitmenin IBAN'ına gider, ${APP_NAME} komisyon almaz.

## Sayfalar

- [Ana sayfa](${base}/): özellikler, nasıl çalıştığı, sık sorulan sorular
- [Özellikler](${base}/ozellikler): bütün özellikler konu konu (profil, randevu, paket ve ödeme, antrenman ve beslenme, gelişim, mesaj, danışanın sayfası, veriler)
- [Pilates eğitmenleri](${base}/pilates-egitmenleri): reformer ve mat; paket, telafi hakkı, kontenjan, ev programı
- [Personal trainer](${base}/personal-trainer): PT paketi, antrenman programı, ölçüm ve beslenme planı
- [Fiyatlar](${base}/fiyatlar): beta süresince ücretsiz; ücretli plana geçmeden en az bir hafta önce haber, beta'da kayıt olanlara 6 ay ücretsiz
- [KVKK aydınlatma metni](${base}/kvkk): hangi veriler, neden ve nerede işleniyor
- [Sağlık verileri açık rıza metni](${base}/acik-riza)
- [Kullanım koşulları](${base}/kosullar)

## Öne çıkanlar

- Yoklama: geldi, gelmedi, geç iptal; kalan ders kendiliğinden düşer, telafi hakkı işlenir.
- Seans paketleri: peşin, taksitli ve indirimli fiyat; deneme dersi; paket biterken yenileme teklifi.
- Dersten önce "Geliyor musun?" hatırlatması ve tek dokunuşla onay.
- Eğitmene özel herkese açık sayfa ve online kayıt formu; grup derslerinde kontenjan ve sabit yer.
- Antrenman programı: 200'den fazla hazır hareket (makine, serbest ağırlık, reformer, mat), her harekette vücut haritasında ana ve yardımcı kaslar, şablondan kopyalama, set/tekrar/ağırlık, danışanın "yaptım" işareti.
- Ölçüm takibi: kilo, kas, yağ oranı, çevre ölçüleri; danışanın sayfasında gelişim grafikleri; periyodik ölçüm hatırlatması.
- Beslenme planı: öğün öğün öneriler, günlük hedefler; kalori hesabı ve diyet listesi yok.
- Programlar ve beslenme planları yazdırılabilir ya da PDF olarak kaydedilebilir.
- Ders notları ve sağlık uyarısı; taksit hatırlatması; hatırlatma ve hazır mesaj metinleri eğitmenin kendi cümleleriyle.
- Excel'den danışan aktarma ve bütün verileri Excel olarak indirme.
- Veriler Frankfurt'taki (AB) sunucularda; sağlık bilgisi yalnızca açık rızayla.

## İletişim

${LEGAL.email}
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
