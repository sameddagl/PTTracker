import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni" };

// DRAFT: must be reviewed by a KVKK lawyer before the public beta.
export default function KvkkPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-sm leading-relaxed">
      <Link href="/" className="font-semibold">
        {APP_NAME}
      </Link>
      <h1 className="mt-8 mb-2 text-2xl font-semibold">KVKK Aydınlatma Metni</h1>
      <p className="mb-6 rounded-md bg-warning/10 px-3 py-2">
        Taslak metindir; hukuki inceleme sonrası güncellenecektir.
      </p>
      <div className="flex flex-col gap-4 text-muted-foreground">
        <p>
          {APP_NAME}, eğitmenlerin danışan, ders, paket ve ödeme kayıtlarını tutmasını sağlayan bir yazılımdır. Danışan
          verileri bakımından veri sorumlusu ilgili eğitmendir; {APP_NAME} veri işleyen sıfatıyla hareket eder.
        </p>
        <p>
          Eğitmen hesabı için ad, e-posta ve kullanım kayıtları; hizmetin sunulması, güvenliğin sağlanması ve yasal
          yükümlülüklerin yerine getirilmesi amaçlarıyla işlenir.
        </p>
        <p>
          Sağlık verileri (sakatlık, hamilelik vb.) yalnızca danışanın açık rızası alındıktan sonra, antrenman planlaması
          amacıyla ve isteğe bağlı olarak kaydedilir.
        </p>
        <p>
          Veriler Avrupa Birliği&apos;ndeki (Frankfurt) sunucularda saklanır. Hesabını ve tüm verilerini dilediğin zaman
          silebilirsin.
        </p>
      </div>
    </main>
  );
}
