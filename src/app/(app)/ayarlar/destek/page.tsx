import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { trainerSupportMessages } from "@/db/support";
import { APP_NAME } from "@/lib/config";
import { LEGAL } from "@/lib/legal";
import { SupportThread } from "./support-thread";

export const metadata: Metadata = { title: "Bize yazın" };

export default async function SupportPage() {
  const { messages, timezone } = await withTrainer(async (tx, id) => ({
    messages: await trainerSupportMessages(tx, id),
    timezone: (await getTrainer(tx, id)).timezone,
  }));
  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader
        title="Bize yazın"
        description={`Soru, öneri, takıldığın bir yer… ${APP_NAME} ekibi buradan cevap verir; cevap gelince bildirim alırsın. E-postayla da yazabilirsin: ${LEGAL.email}`}
      />
      <SupportThread initial={messages} timeZone={timezone} />
    </>
  );
}
