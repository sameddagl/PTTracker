import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { adminDb, withTrainer } from "@/db";
import { getMemberRow, listMembers, listOpenInvites } from "@/db/team";
import { TEAM_COLORS, isTeamColor } from "@/lib/team";
import { profileImageUrl } from "@/lib/storage";
import { setMemberPhotoByOwnerAction } from "../actions";
import { setMemberPhotoAction } from "../../profil/actions";
import { ImageUpload } from "../../profil/image-upload";
import { InviteMemberForm, MemberForm, PermissionSwitches, RemoveMemberButton } from "./member-form";

export const metadata: Metadata = { title: "Eğitmen" };

export default async function MemberPage({ params }: PageProps<"/ayarlar/ekip/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await withTrainer(async (tx, accountId, member) => {
    if (member.role !== "owner") return null;
    const row = await getMemberRow(tx, accountId, id);
    if (!row) return null;
    const index = (await listMembers(tx, accountId)).findIndex((m) => m.id === id);
    const invite = (await listOpenInvites(tx, accountId)).find((i) => i.memberId === id) ?? null;
    return { row, index, me: member, invite };
  });
  if (!data) notFound();
  const { row, index, me, invite } = data;
  const isMe = row.id === me.id;
  // The member's login address, so the owner knows which account it is.
  const [user] = row.userId ? await adminDb.select({ email: authUsers.email }).from(authUsers).where(eq(authUsers.id, row.userId)) : [];
  const color = isTeamColor(row.color) ? row.color : TEAM_COLORS[Math.max(index, 0) % TEAM_COLORS.length];

  return (
    <>
      <Link href="/ayarlar/ekip" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ekip
      </Link>
      <PageHeader title={row.fullName || "Eğitmen"} description={row.role === "owner" ? "Stüdyonun sahibi" : (user?.email ?? "Giriş yapmıyor")} />
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 surface p-5">
          <div className="min-w-0">
            <p className="truncate font-semibold">{row.fullName}</p>
            {row.bio && <p className="text-sm text-muted-foreground">{row.bio}</p>}
            {!row.active && <p className="text-sm text-destructive-strong">Ekipten çıkarıldı</p>}
          </div>
          {/* The owner's own photo goes through their profile action; an instructor's is kept in the owner's folder. */}
          <ImageUpload
            kind="member"
            trainerId={me.userId}
            url={profileImageUrl(row.photoPath)}
            label="Fotoğraf"
            prefix={isMe ? "member" : `member-${row.id}`}
            save={isMe ? setMemberPhotoAction : setMemberPhotoByOwnerAction.bind(null, row.id)}
          />
          <p className="text-xs text-muted-foreground">Danışanlar eğitmeni derslerinde ve stüdyonun sayfasında bu fotoğrafla görür. Eğitmen kendi profilinden de değiştirebilir.</p>
        </section>
        {row.role === "instructor" && !row.userId && row.active && (
          <section aria-labelledby="login-heading" className="flex flex-col gap-3 surface p-5">
            <div>
              <h2 id="login-heading" className="text-base font-semibold">
                Uygulamaya giriş
              </h2>
              <p className="text-sm text-muted-foreground">
                {row.fullName} şu an giriş yapmıyor; derslerini sen yönetiyorsun. Kendi derslerini ve yoklamasını görmek isterse e-postasına davet gönder. Geçmiş dersleri ve
                hakedişi aynen kalır.
              </p>
            </div>
            <InviteMemberForm id={row.id} pendingEmail={invite?.email ?? null} />
          </section>
        )}
        {row.role === "instructor" && (
          <section aria-labelledby="perm-heading" className="flex flex-col gap-4 surface p-5">
            <div>
              <h2 id="perm-heading" className="text-base font-semibold">
                Yetkiler
              </h2>
              <p className="text-sm text-muted-foreground">
                {row.userId
                  ? `${row.fullName.split(" ")[0]} uygulamada bunları yapabilir. Ödemeleri, fiyatları ve stüdyo ayarlarını hiçbir durumda görmez.`
                  : "Giriş yaptığında geçerli olur. Ödemeleri, fiyatları ve stüdyo ayarlarını hiçbir durumda görmez."}
              </p>
            </div>
            <PermissionSwitches id={row.id} permissions={row.permissions} />
          </section>
        )}
        <section className="surface p-5">
          <MemberForm id={row.id} color={color} payRule={row.payRule} isOwner={row.role === "owner"} />
        </section>
        {row.role === "instructor" && row.active && <RemoveMemberButton id={row.id} name={row.fullName || "Eğitmen"} />}
      </div>
    </>
  );
}
