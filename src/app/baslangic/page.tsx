import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { APP_NAME } from "@/lib/config";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Başlangıç" };

export default async function OnboardingPage() {
  const trainer = await withTrainer((tx, id) => getTrainer(tx, id));
  if (trainer.onboardedAt) redirect("/bugun");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <p className="mx-auto inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-lime text-lime-foreground" aria-hidden>
            <Activity className="size-5" />
          </span>
          {APP_NAME}
        </p>
        <div className="flex flex-col gap-6 surface p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="eyebrow">Hoş geldin</p>
            <h1 className="text-3xl font-semibold">Seni tanıyalım</h1>
            <p className="text-sm text-muted-foreground">İki bilgi yeter, sonra ilk danışanını ekleyebilirsin.</p>
          </div>
          <ProfileForm defaultName={trainer.fullName} />
        </div>
      </div>
    </main>
  );
}
