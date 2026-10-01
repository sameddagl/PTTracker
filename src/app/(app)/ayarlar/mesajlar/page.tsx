import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { TEMPLATES, templateText, type TemplateKey } from "@/lib/templates";
import { MessageSettingsForm } from "./message-settings-form";

export const metadata: Metadata = { title: "Hatırlatma ve mesajlar" };

export default async function MessageSettingsPage() {
  const trainer = await withTrainer((tx, id) => getTrainer(tx, id));
  const texts = Object.fromEntries((Object.keys(TEMPLATES) as TemplateKey[]).map((k) => [k, templateText(trainer.messageTemplates, k)])) as Record<
    TemplateKey,
    string
  >;
  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader
        title="Hatırlatma ve mesajlar"
        description="Danışanlara kendiliğinden giden bildirimleri ve butonlara basınca hazır gelen metinleri buradan ayarla."
      />
      <MessageSettingsForm
        initial={{
          remindersEnabled: trainer.remindersEnabled,
          reminderHours: trainer.reminderHours,
          renewalOffersEnabled: trainer.renewalOffersEnabled,
          installmentRemindersEnabled: trainer.installmentRemindersEnabled,
          texts,
        }}
      />
    </>
  );
}
