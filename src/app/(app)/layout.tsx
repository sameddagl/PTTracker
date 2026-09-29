import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav, SideNav } from "@/components/app-nav";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { APP_NAME } from "@/lib/config";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const trainer = await withTrainer((tx, id) => getTrainer(tx, id));
  if (!trainer.onboardedAt) redirect("/baslangic");

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <aside className="hidden border-r bg-muted/30 p-4 md:flex md:flex-col md:gap-6">
        <Link href="/bugun" className="px-3 text-lg font-semibold tracking-tight">
          {APP_NAME}
        </Link>
        <SideNav />
      </aside>
      <main className="mx-auto w-full max-w-3xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-28 md:px-8 md:pt-8 md:pb-12">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
