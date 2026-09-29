import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Giriş" };

const ERRORS: Record<string, string> = {
  baglanti: "Bağlantının süresi dolmuş ya da daha önce kullanılmış. Yeni bir kod iste.",
};

export default async function LoginPage({ searchParams }: PageProps<"/giris">) {
  const { next, hata } = await searchParams;
  const error = typeof hata === "string" ? ERRORS[hata] : undefined;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="text-center text-lg font-semibold tracking-tight">
          {APP_NAME}
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Hoş geldin</CardTitle>
            <CardDescription>Şifre yok. E-postana gelen kodla gir.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <LoginForm next={typeof next === "string" ? next : undefined} />
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          Devam ederek{" "}
          <Link href="/kvkk" className="underline underline-offset-2">
            KVKK aydınlatma metnini
          </Link>{" "}
          okuduğunu kabul edersin.
        </p>
      </div>
    </main>
  );
}
