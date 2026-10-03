import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getTrainer } from "@/db/queries";
import { siteUrl } from "@/lib/config";
import { formatIban } from "@/lib/iban";
import { profileImageUrl } from "@/lib/storage";
import { formatPhone } from "@/lib/whatsapp";
import { ImageUpload } from "./image-upload";
import { getMemberRow, isStudio } from "@/db/team";
import { setMemberPhotoAction } from "./actions";
import { MemberProfileForm } from "./member-profile-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profil ve sayfan" };

export default async function ProfilePage({ searchParams }: PageProps<"/ayarlar/profil">) {
  const { hosgeldin } = await searchParams;
  const { trainer, member, me, studio } = await withTrainer(async (tx, id, member) => ({
    trainer: await getTrainer(tx, id),
    member,
    me: await getMemberRow(tx, id, member.id),
    studio: await isStudio(tx, id),
  }));
  const memberSection = me && (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">{member.role === "owner" ? "Eğitmen olarak profilin" : "Profilin"}</CardTitle>
        <p className="text-sm text-muted-foreground">Danışanların derslerinde ve stüdyonun sayfasında bu ad, fotoğraf ve tanıtım görünür.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ImageUpload kind="member" trainerId={member.userId} url={profileImageUrl(me.photoPath)} label="Fotoğrafın" save={setMemberPhotoAction} />
        <MemberProfileForm fullName={me.fullName} bio={me.bio} />
      </CardContent>
    </Card>
  );

  if (member.role === "instructor") {
    const studioName = trainer.businessName?.trim() || trainer.fullName;
    return (
      <>
        <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" aria-hidden />
          Ayarlar
        </Link>
        <PageHeader title="Profilin" description={`${studioName} ekibindesin.`} />
        {hosgeldin === "1" && (
          <p role="status" className="mb-6 rounded-2xl bg-lime px-4 py-3 text-sm text-lime-foreground">
            {studioName} ekibine hoş geldin! Adını ve kısa bir tanıtım yaz; danışanların seni böyle görecek.
          </p>
        )}
        {memberSection}
      </>
    );
  }

  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader
        title="Profil ve sayfan"
        description="Instagram'daki linkine dokunan herkes bu bilgileri ve paketlerini görür."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Fotoğraflar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <ImageUpload kind="avatar" trainerId={trainer.id} url={profileImageUrl(trainer.avatarPath)} label="Profil fotoğrafı" />
          <ImageUpload kind="cover" trainerId={trainer.id} url={profileImageUrl(trainer.coverPath)} label="Kapak fotoğrafı" />
        </CardContent>
      </Card>

      {studio && memberSection}
      <ProfileForm
        siteUrl={siteUrl()}
        initial={{
          slug: trainer.slug ?? "",
          fullName: trainer.fullName,
          businessName: trainer.businessName ?? "",
          headline: trainer.headline ?? "",
          bio: trainer.bio ?? "",
          city: trainer.city ?? "",
          instagram: trainer.instagram ? `@${trainer.instagram}` : "",
          phone: formatPhone(trainer.phone) ?? "",
          specialties: trainer.specialties.join(", "),
          publicPageEnabled: trainer.publicPageEnabled,
          iban: trainer.iban ? formatIban(trainer.iban) : "",
          ibanHolder: trainer.ibanHolder ?? "",
        }}
      />
    </>
  );
}
