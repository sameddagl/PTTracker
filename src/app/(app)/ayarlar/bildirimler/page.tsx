import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NotifyPrefsForm } from "@/components/notify-prefs-form";
import { PageHeader } from "@/components/page-header";
import { PushToggle } from "@/components/push-toggle";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { prefsView } from "@/lib/notify-prefs";
import { subscribeTrainerAction, unsubscribeTrainerAction } from "../push-actions";
import { saveTrainerPrefsAction } from "./actions";

export const metadata: Metadata = { title: "Bildirimler" };

export default async function NotificationsPage() {
  const trainer = await withTrainer((tx, id) => getTrainer(tx, id));
  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader title="Bildirimler" description="Neyi, nasıl öğrenmek istediğini seç. Değişiklik hemen kaydedilir." />
      <div className="flex flex-col gap-4">
        <PushToggle
          subscribe={subscribeTrainerAction}
          unsubscribe={unsubscribeTrainerAction}
          description="Telefonuna anında bildirim gelsin. Her cihazda ayrı açılır."
        />
        <NotifyPrefsForm rows={prefsView("trainer", trainer.notifyPrefs)} save={saveTrainerPrefsAction} />
        <p className="text-sm text-muted-foreground">
          Mesajlar e-postayla gönderilmez. Giriş kodu e-postaları her zaman gelir.
        </p>
      </div>
    </>
  );
}
