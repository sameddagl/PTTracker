import type { Metadata } from "next";
import { LogOut } from "lucide-react";
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
