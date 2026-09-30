import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getAvailability } from "@/db/booking";
import { getTrainer } from "@/db/queries";
import { todayISO } from "@/lib/format";
import { AvailabilityForm } from "./availability-form";
import { TimeOff } from "./time-off";

export const metadata: Metadata = { title: "Müsaitlik" };

export default async function AvailabilityPage() {
  const { trainer, rules, off } = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    const { rules, off } = await getAvailability(tx, trainerId);
    return { trainer, rules, off };
  });

  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader
        title="Müsaitlik"
        description={`Danışanlar bu saatlere randevu alır. ${
          trainer.lateCancelHours === 0
            ? "İstedikleri zaman ücretsiz iptal edebilirler."
            : `Dersten ${trainer.lateCancelHours} saat öncesine kadar ücretsiz iptal edebilirler.`
        }`}
      />
      <AvailabilityForm
        initial={{
          bookingEnabled: trainer.bookingEnabled,
          bookingLessonMinutes: trainer.bookingLessonMinutes,
          bookingMinNoticeHours: trainer.bookingMinNoticeHours,
          bookingHorizonDays: trainer.bookingHorizonDays,
          rules: rules.map((r) => ({ weekday: r.weekday, startMinute: r.startMinute, endMinute: r.endMinute })),
        }}
      />
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">İzin günleri</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeOff items={off} today={todayISO(trainer.timezone)} />
        </CardContent>
      </Card>
    </>
  );
}
