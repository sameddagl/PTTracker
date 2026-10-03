import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listMembers } from "@/db/team";
import { TemplateForm } from "../template-form";

export const metadata: Metadata = { title: "Yeni paket" };

export default async function NewTemplatePage() {
  const team = await withTrainer((tx, trainerId) => listMembers(tx, trainerId));
  return (
    <>
      <Link href="/paketler" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Paketler
      </Link>
      <PageHeader title="Yeni paket" />
      <TemplateForm instructors={team.map((m) => ({ id: m.id, name: m.fullName || "İsimsiz" }))} />
    </>
  );
}
