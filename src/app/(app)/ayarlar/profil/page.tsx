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
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profil ve sayfam" };

export default async function ProfilePage() {
  const trainer = await withTrainer((tx, id) => getTrainer(tx, id));

  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader
        title="Profil ve sayfam"
        description="Danışanların Instagram'daki linkinden bu bilgileri ve paketlerini görür."
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
