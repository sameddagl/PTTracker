import type { Metadata } from "next";
import { requirePermission } from "@/db";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ClientForm } from "./client-form";

export const metadata: Metadata = { title: "Yeni danışan" };

export default async function NewClientPage() {
  await requirePermission("editClients");
  return (
    <>
      <Link
        href="/danisanlar"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Danışanlar
      </Link>
      <PageHeader title="Yeni danışan" />
      <ClientForm />
    </>
  );
}
