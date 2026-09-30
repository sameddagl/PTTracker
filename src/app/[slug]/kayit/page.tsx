import type { Metadata } from "next";
import { Analytics } from "@/components/analytics";
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
    <div className="min-h-dvh bg-canvas">
      <Analytics />
      <main className="mx-auto max-w-lg px-4 pt-4 pb-16 sm:pt-8">
        <Link
          href={`/${slug}`}
          className="-ml-2 mb-4 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {name}
        </Link>
        <header className="mb-6 flex items-center gap-4 px-1">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted ring-4 ring-card">
            {avatar ? (
              <Image src={avatar} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center bg-lime text-lg font-semibold text-lime-foreground">
                {name.charAt(0).toLocaleUpperCase("tr")}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold">Kayıt ol</h1>
            <p className="mt-1 text-sm text-muted-foreground">{name} başvurunu inceleyip onaylayacak.</p>
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
    </div>
  );
}
