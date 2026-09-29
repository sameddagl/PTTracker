import Link from "next/link";
import { CalendarCheck, MessageCircle, Package, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/config";

const FEATURES = [
  { icon: CalendarCheck, title: "Dersi 2 dokunuşla işle", text: "Geldi, gelmedi, geç iptal. Paket kendiliğinden düşer." },
  { icon: Package, title: "Paketler kendi kurallarınla", text: "Özel, düet, grup; son tarih, dondurma, telafi hakkı." },
  { icon: Wallet, title: "Kim ne kadar borçlu?", text: "Nakit, havale, kart ve kısmi ödemeler tek listede." },
  { icon: MessageCircle, title: "WhatsApp ile uyumlu", text: "Hatırlatma ve paket bitiyor mesajları tek tıkla hazır." },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-10 md:py-20">
      <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>
      <section className="mt-16 flex flex-col gap-5 md:mt-24">
        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          Excel ve WhatsApp&apos;ı bırak. Danışanlarını 10 saniyede yönet.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground text-pretty">
          PT ve pilates eğitmenleri için danışan, paket, ders ve ödeme takibi. Danışanların hiçbir şey indirmez.
        </p>
        <div>
          <Button asChild size="lg">
            <Link href="/giris">Ücretsiz başla</Link>
          </Button>
        </div>
      </section>
      <section className="mt-16 grid gap-6 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3">
            <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-medium">{title}</h2>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
