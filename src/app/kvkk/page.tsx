import type { Metadata } from "next";
import Link from "next/link";
import { Activity, AlertTriangle } from "lucide-react";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni" };

// DRAFT: must be reviewed by a KVKK lawyer before the public beta.
export default function KvkkPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-xl bg-lime text-lime-foreground" aria-hidden>
            <Activity className="size-4" />
          </span>
          {APP_NAME}
        </Link>
        <article className="mt-6 surface p-6 sm:p-10">
          <p className="eyebrow">Kişisel verilerin korunması</p>
          <h1 className="mt-1 text-3xl font-semibold text-balance">KVKK Aydınlatma Metni</h1>
          <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning-strong">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            Taslak metindir; hukuki inceleme sonrası güncellenecektir.
          </p>
          <div className="mt-8 flex max-w-prose flex-col gap-5 text-base leading-relaxed text-pretty text-muted-foreground [&>p:first-child]:text-foreground">
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
        </article>
      </main>
    </div>
  );
}
