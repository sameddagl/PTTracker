import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { todayISO } from "@/lib/format";
import { GroupForm } from "../group-form";

export const metadata: Metadata = { title: "Yeni grup dersi" };

export default async function NewGroupClassPage() {
  const today = await withTrainer(async (tx, trainerId) => todayISO((await getTrainer(tx, trainerId)).timezone));
  return (
    <>
      <Link href="/takvim/grup" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Grup dersleri
      </Link>
      <PageHeader title="Yeni grup dersi" description="Dersler 4 hafta ileriye kadar takvimine eklenir, sonrası kendiliğinden devam eder." />
      <GroupForm
        initial={{ title: "", weekdays: "2,4", startTime: "18:00", durationMinutes: "60", capacity: "8", joinMode: "both", startsOn: today }}
      />
    </>
  );
}
