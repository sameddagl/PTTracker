import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { ensureExerciseLibrary, listExercises } from "@/db/programs";
import { EXERCISE_CATEGORIES } from "@/lib/programs";
import { ExerciseLibrary } from "./exercise-library";

export const metadata: Metadata = { title: "Hareketler" };

export default async function ExercisesPage() {
  const list = await withTrainer(async (tx, trainerId) => {
    await ensureExerciseLibrary(tx, trainerId);
    return listExercises(tx, trainerId);
  });
  return (
    <>
      <Link href="/programlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Programlar
      </Link>
      <PageHeader title="Hareketler" description="Programa eklerken bu listeden seçersin. Video linki eklersen danışan programında izleyebilir." />
      <ExerciseLibrary exercises={list} categories={[...EXERCISE_CATEGORIES]} />
    </>
  );
}
