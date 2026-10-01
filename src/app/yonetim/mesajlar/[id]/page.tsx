import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { adminDb, getClaims, type Tx } from "@/db";
import { adminThread, markSupportReadByAdmin } from "@/db/support";
import { isAdminEmail } from "@/lib/admin";
import { formatPhone } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { ReplyForm } from "./reply-form";

export const metadata: Metadata = { title: "Mesaj", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const when = (d: Date) =>
  new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(d);

export default async function SupportThreadPage({ params }: PageProps<"/yonetim/mesajlar/[id]">) {
  const claims = await getClaims();
  if (!isAdminEmail(claims?.email as string | undefined)) notFound();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = adminDb as unknown as Tx;
  const found = await adminThread(db, id);
  if (!found) notFound();
  await markSupportReadByAdmin(db, id);
  const { thread, messages } = found;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 bg-canvas px-4 py-8 md:px-8">
      <Link href="/yonetim/mesajlar" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Gelen mesajlar
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{thread.name}</h1>
        <p className="text-sm text-muted-foreground">
          {thread.source === "landing" ? "İletişim formu" : "Uygulamadan, eğitmen"}
          {thread.email && (
            <>
              {" · "}
              <a href={`mailto:${thread.email}`} className="underline underline-offset-4">
                {thread.email}
              </a>
            </>
          )}
          {thread.phone && <> · {formatPhone(thread.phone)}</>}
        </p>
      </header>
      <ol className="flex flex-col gap-3">
        {messages.map((m) => (
          <li key={m.id} className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm", m.sender === "admin" ? "self-end bg-primary text-primary-foreground" : "self-start surface")}>
            <p className="whitespace-pre-wrap">{m.body}</p>
            <p className={cn("mt-1 text-xs", m.sender === "admin" ? "opacity-70" : "text-muted-foreground")}>
              {m.sender === "admin" ? "Sen" : thread.name} · {when(m.createdAt)}
              {m.sender === "admin" && thread.trainerId && (m.readAt ? " · okundu" : " · okunmadı")}
            </p>
          </li>
        ))}
      </ol>
      <ReplyForm threadId={thread.id} viaEmail={!thread.trainerId} closed={Boolean(thread.closedAt)} />
    </main>
  );
}
