import Link from "next/link";
import { Activity } from "lucide-react";
import { redirect } from "next/navigation";
import { BottomNav, MobileTopBar, SideNav } from "@/components/app-nav";
import { withTrainer } from "@/db";
import { countPendingApplications } from "@/db/applications";
import { countUnread, listThreads } from "@/db/messages";
import { countPendingPayments } from "@/db/payments";
import { getTrainer } from "@/db/queries";
import { clientIdsTaughtBy, isStudio } from "@/db/team";
import { APP_NAME } from "@/lib/config";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { trainer, member, studio, pending, payments, unread } = await withTrainer(async (tx, id, member) => ({
    trainer: await getTrainer(tx, id),
    member,
    studio: await isStudio(tx, id),
    pending: member.role === "owner" ? await countPendingApplications(tx, id) : 0,
    payments: member.role === "owner" ? await countPendingPayments(tx, id) : 0,
    // An instructor's badge counts the clients they teach.
    unread:
      member.role === "owner"
        ? await countUnread(tx, id)
        : await (async () => {
            const mine = await clientIdsTaughtBy(tx, id, member.id);
            return (await listThreads(tx, id)).filter((t) => mine.has(t.clientId)).reduce((n, t) => n + t.unread, 0);
          })(),
  }));
  if (!trainer.onboardedAt) redirect("/baslangic");
  const badges = { "/danisanlar": pending, "/odemeler": payments, "/mesajlar": unread };
  const scope = { role: member.role, studio };

  return (
    <div className="min-h-dvh bg-canvas md:grid md:grid-cols-[256px_1fr]">
      <aside className="hidden p-4 md:block">
        <div className="sticky top-4 flex h-[calc(100dvh-2rem)] flex-col gap-8 surface p-4">
          <Link href="/bugun" className="flex items-center gap-2 px-2 pt-1 text-xl font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-xl bg-lime text-lime-foreground" aria-hidden>
              <Activity className="size-4" />
            </span>
            {APP_NAME}
          </Link>
          <SideNav badges={badges} scope={scope} />
        </div>
      </aside>
      <MobileTopBar name={member.name || trainer.fullName} appName={APP_NAME} />
      {/* Pages opt into a wider column by rendering an element with data-wide (the week calendar). */}
      <main className="mx-auto w-full max-w-3xl has-[[data-wide]]:max-w-6xl px-4 pt-5 pb-[calc(8.5rem+env(safe-area-inset-bottom))] has-[[data-chat]]:pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8 md:pt-10 md:pb-12">
        {children}
      </main>
      <BottomNav badges={badges} scope={scope} />
    </div>
  );
}
