import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ChevronRight, ClipboardList, Globe, LogOut, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { getClaims, withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { signOut } from "../../giris/actions";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  const [trainer, claims] = await Promise.all([withTrainer((tx, id) => getTrainer(tx, id)), getClaims()]);

  return (
    <>
      <PageHeader title="Ayarlar" />
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hesap</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Ad</dt>
              <dd>{trainer.fullName || "—"}</dd>
              <dt className="text-muted-foreground">E-posta</dt>
              <dd className="truncate">{claims?.email ?? "—"}</dd>
              <dt className="text-muted-foreground">Geç iptal kuralı</dt>
              <dd>Dersten {trainer.lateCancelHours} saat öncesine kadar ücretsiz</dd>
            </dl>
          </CardContent>
        </Card>
        <Link
          href="/ayarlar/profil"
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <Globe className="size-4 text-muted-foreground" aria-hidden />
          <span className="flex-1">
            <span className="block font-medium">Profil ve sayfam</span>
            <span className="block text-xs text-muted-foreground">
              {trainer.publicPageEnabled && trainer.slug ? `Yayında · /${trainer.slug}` : "Henüz yayında değil"}
            </span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
        <Link
          href="/ayarlar/paketler"
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <Package className="size-4 text-muted-foreground" aria-hidden />
          <span className="flex-1 font-medium">Paket şablonları</span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
        <Link
          href="/ayarlar/musaitlik"
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
          <span className="flex-1">
            <span className="block font-medium">Müsaitlik ve randevu</span>
            <span className="block text-xs text-muted-foreground">
              {trainer.bookingEnabled ? "Danışanlar randevu alabiliyor" : "Randevu kapalı"}
            </span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
        <Link
          href="/ayarlar/kayit-formu"
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
          <span className="flex-1 font-medium">Kayıt formu</span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            <LogOut />
            Çıkış yap
          </Button>
        </form>
      </div>
    </>
  );
}
