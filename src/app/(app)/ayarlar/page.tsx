import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ChevronRight, ClipboardList, ExternalLink, Globe, LogOut, Package, UsersRound } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { Avatar } from "@/components/avatar";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { getClaims, withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { siteUrl } from "@/lib/config";
import { signOut } from "../../giris/actions";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const [trainer, claims] = await Promise.all([withTrainer((tx, id) => getTrainer(tx, id)), getClaims()]);

  const pageUrl = trainer.publicPageEnabled && trainer.slug ? `${siteUrl()}/${trainer.slug}` : null;
  const rows = [
    {
      href: "/ayarlar/profil",
      icon: Globe,
      title: "Profil ve sayfam",
      hint: trainer.publicPageEnabled && trainer.slug ? `Yayında · /${trainer.slug}` : "Henüz yayında değil",
    },
    { href: "/paketler", icon: Package, title: "Paketler", hint: "Fiyatlar, indirimler, taksitler" },
    { href: "/takvim/grup", icon: UsersRound, title: "Grup dersleri", hint: "Kapasite ve sabit yerler" },
    {
      href: "/ayarlar/musaitlik",
      icon: CalendarClock,
      title: "Müsaitlik ve randevu",
      hint: trainer.bookingEnabled ? "Danışanlar randevu alabiliyor" : "Randevu kapalı",
    },
    { href: "/ayarlar/kayit-formu", icon: ClipboardList, title: "Kayıt formu", hint: "Danışandan istenen bilgiler" },
  ];

  return (
    <>
      <PageHeader title="Ayarlar" />
      <div className="flex flex-col gap-6">
        <section aria-label="Hesap" className="flex items-center gap-4 surface p-5">
          <Avatar name={trainer.fullName || claims?.email || "?"} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{trainer.fullName || "—"}</p>
            <p className="truncate text-sm text-muted-foreground">{claims?.email ?? "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Geç iptal: dersten {trainer.lateCancelHours} saat öncesine kadar ücretsiz</p>
          </div>
        </section>

        {pageUrl ? (
          <section aria-labelledby="page-heading" className="rounded-2xl bg-lime p-5 text-lime-foreground">
            <p id="page-heading" className="text-sm font-medium opacity-75">
              Sayfan yayında
            </p>
            <p className="mt-1 truncate text-lg font-semibold">{pageUrl.replace(/^https?:\/\//, "")}</p>
            <p className="mt-1 text-sm opacity-75">Instagram bio&apos;na koy; danışanlar paket seçip buradan kayıt olur.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild className="bg-lime-foreground text-lime hover:bg-lime-foreground/85">
                <a href={pageUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  Sayfamı aç
                </a>
              </Button>
              <CopyButton text={pageUrl} variant="outline" className="border-lime-foreground/20 bg-transparent hover:bg-lime-foreground/10" />
            </div>
          </section>
        ) : (
          <Link href="/ayarlar/profil" className="flex items-center gap-4 rounded-2xl border border-dashed bg-card/50 p-5 hover:bg-card">
            <Globe className="size-5 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Sayfan henüz yayında değil</span>
              <span className="block text-sm text-muted-foreground">Adresini seç ve yayınla; linkini Instagram&apos;da paylaş.</span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
          </Link>
        )}

        <ul className="divide-y overflow-hidden surface">
          {rows.map(({ href, icon: Icon, title, hint }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted [&_svg]:size-[18px]">
                  <Icon aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{hint}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <form action={signOut}>
          <SubmitButton variant="outline">
            <LogOut />
            Çıkış yap
          </SubmitButton>
        </form>
      </div>
    </>
  );
}
