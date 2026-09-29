import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Ödemeler" };

export default function PaymentsPage() {
  return (
    <>
      <PageHeader title="Ödemeler" />
      <EmptyState icon={<Wallet />} title="Ödeme defteri hazırlanıyor">
        Nakit, havale ve kart ödemeleri, kısmi ödemeler ve borçlu listesi sıradaki adımda.
      </EmptyState>
    </>
  );
}
