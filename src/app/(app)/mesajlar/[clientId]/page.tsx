import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ChevronLeft, Link2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { withTrainer } from "@/db";
import { getThread } from "@/db/messages";
import { getActivePortalLink } from "@/db/portal";
import { getTrainer } from "@/db/queries";
import { clients } from "@/db/schema";
import { TrainerThread } from "./thread";

export const metadata: Metadata = { title: "Mesajlar" };

export default async function ThreadPage({ params }: PageProps<"/mesajlar/[clientId]">) {
  const { clientId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(clientId)) notFound();

  const data = await withTrainer(async (tx, trainerId) => {
    const [client] = await tx
      .select({ id: clients.id, fullName: clients.fullName, archivedAt: clients.archivedAt })
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId)));
    if (!client) return null;
    const thread = await getThread(tx, trainerId, clientId);
    const portal = await getActivePortalLink(tx, clientId);
    const { timezone } = await getTrainer(tx, trainerId);
    return { client, thread, hasPortal: Boolean(portal), timezone };
  });
  if (!data) notFound();
  const { client, thread, hasPortal, timezone } = data;

  return (
    <>
      <Link href="/mesajlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Mesajlar
      </Link>
      <header className="mb-4 flex items-center gap-3">
        <Avatar name={client.fullName} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl leading-tight font-semibold">{client.fullName}</h1>
          <Link href={`/danisanlar/${client.id}`} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Danışan sayfası
          </Link>
        </div>
      </header>
      {!hasPortal && !client.archivedAt && (
        <p className="mb-4 flex items-start gap-3 rounded-2xl bg-warning/10 px-4 py-3 text-sm">
          <Link2 className="mt-0.5 size-4 shrink-0 text-warning-strong" aria-hidden />
          <span>
            Danışanın mesajları görebilmesi için kişisel sayfa linki olmalı.{" "}
            <Link href={`/danisanlar/${client.id}`} className="font-medium underline underline-offset-4">
              Link oluştur
            </Link>
          </span>
        </p>
      )}
      <TrainerThread
        key={client.id}
        clientId={client.id}
        firstName={client.fullName.split(" ")[0]}
        initial={thread}
        timeZone={timezone}
        archived={Boolean(client.archivedAt)}
      />
    </>
  );
}
