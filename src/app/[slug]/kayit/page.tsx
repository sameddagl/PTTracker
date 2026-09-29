import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toDef } from "@/db/intake";
import { getSignupForm } from "@/lib/signup";
import { profileImageUrl } from "@/lib/storage";
import { signupAction } from "./actions";
import { SignupForm } from "./signup-form";

export async function generateMetadata({ params }: PageProps<"/[slug]/kayit">): Promise<Metadata> {
  const form = await getSignupForm((await params).slug);
  if (!form) return {};
  const name = form.trainer.businessName || form.trainer.fullName;
  return { title: { absolute: `Kayıt · ${name}` }, robots: { index: false } };
}

export default async function SignupPage({ params, searchParams }: PageProps<"/[slug]/kayit">) {
  const { slug } = await params;
  const { paket } = await searchParams;
  const form = await getSignupForm(slug);
  if (!form || form.packages.length === 0) notFound();

  const { trainer, packages, fields } = form;
  const name = trainer.businessName || trainer.fullName;
  const avatar = profileImageUrl(trainer.avatarPath);

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-6 pb-16">
      <Link href={`/${slug}`} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        {name}
      </Link>
      <header className="mb-8 flex items-center gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
          {avatar ? (
            <Image src={avatar} alt="" fill sizes="48px" className="object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center font-semibold text-muted-foreground">
              {name.charAt(0).toLocaleUpperCase("tr")}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Kayıt ol</h1>
          <p className="text-sm text-muted-foreground">{name} başvurunu inceleyip onaylayacak.</p>
        </div>
      </header>
      <SignupForm
        action={signupAction.bind(null, slug)}
        packages={packages}
        fields={fields.map(toDef)}
        initialPackageId={typeof paket === "string" && packages.some((p) => p.id === paket) ? paket : ""}
        trainerName={name}
      />
    </main>
  );
}
