import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Globe, Smartphone } from "lucide-react";
import { adminDb, getClaims, type Tx } from "@/db";
import { adminThreads } from "@/db/support";
import { isAdminEmail } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Gelen mesajlar", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const when = (d: Date) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(d);

export default async function SupportInboxPage() {
  const claims = await getClaims();
  if (!isAdminEmail(claims?.email as string | undefined)) notFound();
  const threads = await adminThreads(adminDb as unknown as Tx);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 bg-canvas px-4 py-8 md:px-8">
      <Link href="/yonetim" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Yönetim
      </Link>
      <header>
        <h1 className="text-3xl font-semibold">Gelen mesajlar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          İletişim formundan gelenlere cevabın e-postayla gider. Eğitmenler cevabı uygulamada görür, bildirim alır.
        </p>
      </header>
      {threads.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">Henüz mesaj yok.</p>
      ) : (
        <ul className="divide-y overflow-hidden surface">
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/yonetim/mesajlar/${t.id}`} className={cn("flex items-start gap-3 px-4 py-3.5 hover:bg-muted/50", t.closedAt && "opacity-60")}>
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted" aria-hidden>
                  {t.source === "landing" ? <Globe className="size-4" /> : <Smartphone className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cn("truncate", t.unread > 0 ? "font-semibold" : "font-medium")}>{t.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{when(t.lastMessageAt)}</span>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {t.source === "landing" ? "İletişim formu" : "Eğitmen"} · {t.email ?? "e-posta yok"}
                    {t.closedAt ? " · kapandı" : ""}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{t.preview}</span>
                </span>
                {t.unread > 0 && (
                  <span className="mt-1 min-w-6 rounded-full bg-lime px-1.5 text-center text-xs leading-6 font-semibold text-lime-foreground tabular-nums">{t.unread}</span>
                )}
                <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
