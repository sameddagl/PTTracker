"use client";

import { useTransition } from "react";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteClientAction, restoreClientAction } from "../actions";

export function ArchivedBanner({ clientId, name, archivedOn }: { clientId: string; name: string; archivedOn: string }) {
  const [restoring, startRestore] = useTransition();
  const [erasing, startErase] = useTransition();
  const { ask, dialog } = useConfirm();

  const erase = async () => {
    const answer = await ask({
      title: `${name} kalıcı olarak silinsin mi?`,
      body: "Bütün kayıtları (paketler, dersler, ödemeler, dekontlar, kayıt formu) silinir. Bunu geri alamazsın.",
      input: { label: "Onaylamak için SİL yaz", placeholder: "SİL", maxLength: 10 },
      confirmLabel: "Kalıcı olarak sil",
      destructive: true,
    });
    if (answer === null) return;
    if (answer.toLocaleUpperCase("tr") !== "SİL") return void toast.error("Silmek için tam olarak SİL yazmalısın.");
    startErase(() => deleteClientAction(clientId));
  };

  return (
    <>
      {dialog}
      <div role="status" className="mb-8 flex flex-col gap-3 surface bg-muted/50 p-4">
        <p className="text-sm">
          <span className="font-medium">Arşivde</span>
          <span className="text-muted-foreground"> · {archivedOn} tarihinde arşive alındı. Listelerde görünmez, danışan sayfası kapalı.</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" loading={restoring} disabled={erasing} onClick={() => startRestore(() => restoreClientAction(clientId))}>
            <ArchiveRestore />
            Arşivden çıkar
          </Button>
          <Button type="button" variant="outline" loading={erasing} disabled={restoring} onClick={erase} className="text-destructive-strong">
            <Trash2 />
            Kalıcı olarak sil
          </Button>
        </div>
      </div>
    </>
  );
}
