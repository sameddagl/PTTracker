import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav, SideNav } from "@/components/app-nav";
import { withTrainer } from "@/db";
import { countPendingApplications } from "@/db/applications";
import { countPendingPayments } from "@/db/payments";
import { getTrainer } from "@/db/queries";
import { APP_NAME } from "@/lib/config";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { trainer, pending, payments } = await withTrainer(async (tx, id) => ({
    trainer: await getTrainer(tx, id),
    pending: await countPendingApplications(tx, id),
    payments: await countPendingPayments(tx, id),
  }));
  if (!trainer.onboardedAt) redirect("/baslangic");
  const badges = { "/danisanlar": pending, "/odemeler": payments };

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <aside className="hidden border-r bg-muted/30 p-4 md:flex md:flex-col md:gap-6">
        <Link href="/bugun" className="px-3 text-lg font-semibold tracking-tight">
          {APP_NAME}
        </Link>
        <SideNav badges={badges} />
      </aside>
      {/* Pages opt into a wider column by rendering an element with data-wide (the week calendar). */}
      <main className="mx-auto w-full max-w-3xl has-[[data-wide]]:max-w-6xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-28 md:px-8 md:pt-8 md:pb-12">
        {children}
      </main>
      <BottomNav badges={badges} />
    </div>
  );
}
