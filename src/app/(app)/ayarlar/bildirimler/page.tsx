import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NotifyPrefsForm } from "@/components/notify-prefs-form";
import { PageHeader } from "@/components/page-header";
import { InstallSteps } from "@/components/install-guide";
import { APP_NAME, siteUrl } from "@/lib/config";
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
      <PageHeader title="Bildirimler" description="Neyi, hangi yolla öğrenmek istediğini seç. Seçimin hemen kaydedilir." />
      <div className="flex flex-col gap-4">
        <section aria-labelledby="install-heading" className="flex flex-col gap-4 surface p-5">
          <div>
            <h2 id="install-heading" className="text-base font-semibold">
              Bu cihazda bildirimler
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Her telefon ve bilgisayarda ayrı açılır. iPhone&apos;da önce ana ekrana eklemen gerekir.</p>
          </div>
          <InstallSteps
            appName={APP_NAME}
            url={`${siteUrl()}/bugun`}
            notifyWhere="bu sayfada"
            push={{
              subscribe: subscribeTrainerAction,
              unsubscribe: unsubscribeTrainerAction,
              description: "Telefonuna anında bildirim gelsin. Her cihazda ayrı açılır.",
            }}
          />
        </section>
        <NotifyPrefsForm rows={prefsView("trainer", trainer.notifyPrefs)} save={saveTrainerPrefsAction} />
        <p className="text-sm text-muted-foreground">
          Mesajlar e-postayla gelmez. Giriş kodu e-postası her zaman gelir.
        </p>
      </div>
    </>
  );
}
