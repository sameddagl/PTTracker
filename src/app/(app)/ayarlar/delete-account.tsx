"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROFILE_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { deleteAccountAction } from "./account-actions";

/** "Hesabı sil": typed confirmation, then photos (browser, own session) and the account (server). */
export function DeleteAccount({ trainerId, clientCount }: { trainerId: string; clientCount: number }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  const ready = confirm.trim().toLocaleUpperCase("tr") === "SİL";

  function erase() {
    start(async () => {
      // Profile and cover photos live in Storage, outside the database cascade.
      try {
        const storage = createClient().storage.from(PROFILE_BUCKET);
        const { data } = await storage.list(trainerId, { limit: 100 });
        if (data && data.length > 0) await storage.remove(data.map((f) => `${trainerId}/${f.name}`));
      } catch {
        // Photos are public anyway and orphaned without the account; don't block the deletion.
      }
      const res = await deleteAccountAction(confirm);
      if (res?.error) toast.error(res.error);
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" className="self-start text-destructive-strong hover:text-destructive-strong" onClick={() => setOpen(true)}>
        <Trash2 />
        Hesabımı sil
      </Button>
    );
  }

  return (
    <section aria-labelledby="delete-heading" className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
      <h2 id="delete-heading" className="text-base font-semibold text-destructive-strong">
        Hesabı kalıcı olarak sil
      </h2>
      <p className="text-sm text-muted-foreground">
        Hesabın ve içindeki her şey silinir: {clientCount > 0 ? `${clientCount} danışan, ` : ""}paketler, dersler, ödemeler, dekontlar,
        kayıt formu cevapları ve herkese açık sayfan. Danışanlarının kişisel linkleri çalışmaz. Bu işlem geri alınamaz.
      </p>
      <label className="flex flex-col gap-2 text-sm font-medium">
        Onaylamak için SİL yaz
        <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className="max-w-40" />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="destructive" disabled={!ready} loading={pending} onClick={erase}>
          <Trash2 />
          Hesabımı kalıcı olarak sil
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => (setOpen(false), setConfirm(""))}>
          Vazgeç
        </Button>
      </div>
    </section>
  );
}
