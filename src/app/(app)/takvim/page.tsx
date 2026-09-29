import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Takvim" };

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Takvim" />
      <EmptyState icon={<CalendarDays />} title="Takvim hazırlanıyor">
        Haftalık görünüm, tekrarlayan dersler ve çakışma uyarısı sıradaki adımda.
      </EmptyState>
    </>
  );
}
