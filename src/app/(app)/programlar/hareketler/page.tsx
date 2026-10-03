import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listMembers } from "@/db/team";
import { can, mayEditShared } from "@/lib/permissions";
import { ensureExerciseLibrary, listExercises } from "@/db/programs";
import { EXERCISE_CATEGORIES } from "@/lib/programs";
import { ExerciseLibrary } from "./exercise-library";

export const metadata: Metadata = { title: "Hareketler" };

export default async function ExercisesPage() {
  const { list, canCreate, editableIds, makers } = await withTrainer(async (tx, trainerId, member) => {
    await ensureExerciseLibrary(tx, trainerId);
    const list = await listExercises(tx, trainerId);
    const team = await listMembers(tx, trainerId, { includeInactive: true });
    // Studios: who added each custom exercise, and which ones this member may change.
    const makers = team.length > 1 ? Object.fromEntries(list.filter((e) => e.createdBy).map((e) => [e.id, team.find((m) => m.id === e.createdBy)?.fullName ?? ""])) : {};
    return { list, canCreate: can(member, "createPrograms"), editableIds: list.filter((e) => mayEditShared(member, e.createdBy)).map((e) => e.id), makers };
  });
  return (
    <>
      <Link href="/programlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Programlar
      </Link>
      <PageHeader title="Hareketler" description="Programa eklerken bu listeden seçersin. Video linki eklersen danışan programında izleyebilir." />
      <ExerciseLibrary exercises={list} categories={[...EXERCISE_CATEGORIES]} canCreate={canCreate} editableIds={editableIds} makers={makers} />
    </>
  );
}
