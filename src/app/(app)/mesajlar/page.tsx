import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listMessageableClients, listThreads } from "@/db/messages";
import { getTrainer } from "@/db/queries";
import { formatDayMonth, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NewMessage } from "./new-message";

export const metadata: Metadata = { title: "Mesajlar" };

const dayKey = (d: Date, timeZone: string) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);

/** "şimdi", "5 dk", "14:32" today, "Dün", then "12 Eki". */
function when(d: Date, timeZone: string, now = new Date()) {
  const minutes = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (minutes < 1) return "şimdi";
  if (minutes < 60) return `${minutes} dk`;
  if (dayKey(d, timeZone) === dayKey(now, timeZone)) return formatTime(d, timeZone);
  if (dayKey(d, timeZone) === dayKey(new Date(now.getTime() - 86_400_000), timeZone)) return "Dün";
  return formatDayMonth(d, timeZone);
}

export default async function MessagesPage() {
  const { threads, clients, timezone } = await withTrainer(async (tx, trainerId) => ({
    threads: await listThreads(tx, trainerId),
    clients: await listMessageableClients(tx, trainerId),
    timezone: (await getTrainer(tx, trainerId)).timezone,
  }));
  const unread = threads.filter((t) => t.unread > 0).length;

  return (
    <>
      <div className="relative">
        <PageHeader
          title="Mesajlar"
          description={unread > 0 ? `${unread} okunmamış konuşma` : threads.length > 0 ? `${threads.length} konuşma` : undefined}
          action={<NewMessage clients={clients} />}
        />
      </div>

      {threads.length === 0 ? (
        <EmptyState icon={<MessagesSquare />} title="Henüz mesaj yok">
          Danışanların kişisel sayfalarından sana yazabilir. Sen de “Yeni mesaj” ile bir danışana ilk mesajı gönderebilirsin.
        </EmptyState>
      ) : (
        <ul className="divide-y overflow-hidden surface">
          {threads.map((t) => (
            <li key={t.clientId}>
              <Link href={`/mesajlar/${t.clientId}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50">
                <Avatar name={t.fullName} className={cn(t.archived && "opacity-60")} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={cn("min-w-0 flex-1 truncate", t.unread > 0 ? "font-semibold" : "font-medium")}>
                      {t.fullName}
                      {t.archived && <span className="font-normal text-muted-foreground"> · arşivde</span>}
                    </span>
                    <time dateTime={t.createdAt.toISOString()} className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {when(t.createdAt, timezone)}
                    </time>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className={cn("min-w-0 flex-1 truncate text-sm", t.unread > 0 ? "text-foreground" : "text-muted-foreground")}>
                      {t.sender === "trainer" && "Sen: "}
                      {t.body}
                    </span>
                    {t.unread > 0 && (
                      <span
                        className="min-w-6 rounded-full bg-lime px-2 text-center text-xs leading-6 font-semibold text-lime-foreground tabular-nums"
                        aria-label={`${t.unread} okunmamış`}
                      >
                        {t.unread}
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
