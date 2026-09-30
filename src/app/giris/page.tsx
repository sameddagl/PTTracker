import type { Metadata } from "next";
import { Analytics } from "@/components/analytics";
import Link from "next/link";
import { Activity } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Giriş" };

const ERRORS: Record<string, string> = {
  baglanti: "Linkin süresi dolmuş ya da daha önce kullanılmış. Yeni kod iste.",
};

export default async function LoginPage({ searchParams }: PageProps<"/giris">) {
  const { next, hata, silindi } = await searchParams;
  const error = typeof hata === "string" ? ERRORS[hata] : undefined;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <Analytics />
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="mx-auto inline-flex min-h-11 items-center gap-2.5 rounded-full text-lg font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-lime text-lime-foreground" aria-hidden>
            <Activity className="size-5" />
          </span>
          {APP_NAME}
        </Link>
        <div className="flex flex-col gap-6 surface p-6 sm:p-8">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl font-semibold">Hoş geldin</h1>
            <p className="text-sm text-muted-foreground">Şifre yok. E-postana gelen kodla gir.</p>
          </div>
          {silindi === "1" && (
            <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success-strong">
              Hesabın ve tüm verilerin silindi. İstersen yeniden hesap açabilirsin.
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive-strong">
              {error}
            </p>
          )}
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>
        <p className="px-4 text-center text-xs leading-relaxed text-muted-foreground">
          Devam ederek{" "}
          <Link href="/kosullar" className="font-medium text-foreground underline underline-offset-2">
            Kullanım Koşulları
          </Link>
          &apos;nı kabul etmiş olursun. Kişisel verilerin{" "}
          <Link href="/kvkk#egitmenler" className="font-medium text-foreground underline underline-offset-2">
            Aydınlatma Metni
          </Link>
          &apos;ne göre işlenir.
        </p>
      </div>
    </main>
  );
}
