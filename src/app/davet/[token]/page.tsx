import type { Metadata } from "next";
import Link from "next/link";
import { Activity, LogOut } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { getClaims } from "@/db";
import { inviteByToken } from "@/db/team";
import { APP_NAME } from "@/lib/config";
import { signOut } from "../../giris/actions";
import { AcceptForm } from "./accept-form";

export const metadata: Metadata = { title: "Ekip daveti", robots: { index: false, follow: false } };

export default async function InvitePage({ params }: PageProps<"/davet/[token]">) {
  const { token } = await params;
  const [invite, claims] = await Promise.all([inviteByToken(token), getClaims()]);
  const email = (claims?.email as string | undefined)?.toLowerCase() ?? null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="mx-auto inline-flex min-h-11 items-center gap-2.5 text-lg font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-lime text-lime-foreground" aria-hidden>
            <Activity className="size-5" />
          </span>
          {APP_NAME}
        </Link>
        <div className="flex flex-col gap-5 surface p-6 sm:p-8">
          {!invite ? (
            <>
              <h1 className="text-2xl font-semibold">Bu davet geçerli değil</h1>
              <p className="text-sm text-muted-foreground">
                Linkin süresi dolmuş, iptal edilmiş ya da daha önce kullanılmış olabilir. Seni davet eden stüdyodan yeni bir davet iste.
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <p className="eyebrow">Ekip daveti</p>
                <h1 className="text-2xl leading-tight font-semibold">{invite.studio} seni ekibine davet etti</h1>
                <p className="text-sm text-muted-foreground">
                  Katıldığında derslerini, yoklamayı ve danışanlarının notlarını {APP_NAME}&apos;dan takip edersin. Ödemeleri ve fiyatları stüdyo yönetir.
                </p>
              </div>
              {!email ? (
                <>
                  <p className="text-sm">
                    Davet <strong className="font-medium">{invite.email}</strong> adresine gönderildi. Bu adresle giriş yap; şifre yok, e-postana kod gelir.
                  </p>
                  <Button asChild size="lg">
                    <Link href={`/giris?next=${encodeURIComponent(`/davet/${token}`)}`}>Giriş yap ve katıl</Link>
                  </Button>
                </>
              ) : email !== invite.email ? (
                <>
                  <p role="alert" className="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning-strong">
                    Şu an <strong className="font-medium">{email}</strong> ile girişlisin; davet <strong className="font-medium">{invite.email}</strong> adresine
                    gönderildi. Çıkış yapıp o adresle giriş yap.
                  </p>
                  <form action={signOut}>
                    <SubmitButton variant="outline">
                      <LogOut />
                      Çıkış yap
                    </SubmitButton>
                  </form>
                </>
              ) : (
                <AcceptForm token={token} />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
