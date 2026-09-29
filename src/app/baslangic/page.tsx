import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { APP_NAME } from "@/lib/config";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Başlangıç" };

export default async function OnboardingPage() {
  const trainer = await withTrainer((tx, id) => getTrainer(tx, id));
  if (trainer.onboardedAt) redirect("/bugun");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <p className="text-center text-xl font-semibold tracking-tight">{APP_NAME}</p>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Seni tanıyalım</CardTitle>
            <CardDescription>İki bilgi yeter, sonra ilk danışanını ekleyebilirsin.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm defaultName={trainer.fullName} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
