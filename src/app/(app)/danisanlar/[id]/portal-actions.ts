"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withTrainer } from "@/db";
import { createPortalLink, revokePortalLinks } from "@/db/portal";
import { portalUrl } from "@/lib/portal";

export async function createPortalLinkAction(clientId: string): Promise<{ url: string } | { error: string }> {
  const id = z.uuid().safeParse(clientId);
  if (!id.success) return { error: "Bir sorun oldu. Sayfayı yenileyip tekrar dene." };
  try {
    // RLS + the (client_id, trainer_id) foreign key reject another trainer's client.
    const link = await withTrainer((tx, trainerId) => createPortalLink(tx, trainerId, id.data));
    revalidatePath(`/danisanlar/${id.data}`);
    return { url: portalUrl(link.token) };
  } catch (e) {
    console.error("[portal] create failed", e);
    return { error: "Link oluşturulamadı." };
  }
}

export async function revokePortalLinkAction(clientId: string): Promise<{ ok: boolean }> {
  const id = z.uuid().safeParse(clientId);
  if (!id.success) return { ok: false };
  await withTrainer((tx) => revokePortalLinks(tx, id.data));
  revalidatePath(`/danisanlar/${id.data}`);
  return { ok: true };
}
