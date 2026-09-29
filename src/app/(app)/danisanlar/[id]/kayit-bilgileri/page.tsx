import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listIntakeAnswers, listIntakeFields, toDef } from "@/db/intake";
import { clients, consents } from "@/db/schema";
import { answerToRaw } from "@/lib/intake";
import { AnswersForm } from "./answers-form";

export const metadata: Metadata = { title: "Kayıt bilgileri" };

export default async function ClientAnswersPage({ params }: PageProps<"/danisanlar/[id]/kayit-bilgileri">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const data = await withTrainer(async (tx, trainerId) => {
    const [client] = await tx
      .select({ id: clients.id, fullName: clients.fullName })
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.trainerId, trainerId)));
    if (!client) return null;
    const fields = await listIntakeFields(tx, trainerId, { activeOnly: true });
    const answers = await listIntakeAnswers(tx, { clientId: id });
    const consent = await tx
      .select({ id: consents.id })
      .from(consents)
      .where(and(eq(consents.clientId, id), eq(consents.kind, "health_data"), isNull(consents.revokedAt)))
      .limit(1);
    return { client, fields, answers, hasConsent: consent.length > 0 };
  });
  if (!data) notFound();

  // Answers are oldest first, so the last one per question is the current one.
  const current = new Map(data.answers.filter((a) => a.fieldId).map((a) => [a.fieldId!, answerToRaw(a)]));

  return (
    <>
      <Link
        href={`/danisanlar/${data.client.id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {data.client.fullName}
      </Link>
      <PageHeader title="Kayıt bilgileri" description="Danışanın kayıt formundaki cevapları. Boş bıraktığın cevap silinir." />
      {data.fields.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Kayıt formunda soru yok. <Link href="/ayarlar/kayit-formu" className="font-medium text-foreground underline">Soru ekle</Link>
        </p>
      ) : (
        <AnswersForm
          clientId={data.client.id}
          hasConsent={data.hasConsent}
          fields={data.fields.map((f) => ({ ...toDef(f), current: current.get(f.id) ?? [] }))}
        />
      )}
    </>
  );
}
