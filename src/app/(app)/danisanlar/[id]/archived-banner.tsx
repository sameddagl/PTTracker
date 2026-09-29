"use client";

import { useTransition } from "react";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteClientAction, restoreClientAction } from "../actions";

export function ArchivedBanner({ clientId, name, archivedOn }: { clientId: string; name: string; archivedOn: string }) {
  const [restoring, startRestore] = useTransition();
  const [erasing, startErase] = useTransition();

  const erase = () => {
    const answer = window.prompt(
      `${name} ve tüm kayıtları (paketler, dersler, ödemeler, dekontlar, kayıt formu) kalıcı olarak silinecek. Bu geri alınamaz.\n\nOnaylamak için SİL yaz:`,
    );
    if (answer?.trim().toLocaleUpperCase("tr") !== "SİL") return;
    startErase(() => deleteClientAction(clientId));
  };

  return (
    <div role="status" className="mb-8 flex flex-col gap-3 rounded-xl border bg-muted/50 p-4">
      <p className="text-sm">
        <span className="font-medium">Arşivde</span>
        <span className="text-muted-foreground"> · {archivedOn} tarihinde arşivlendi. Listelerde görünmez, portal linki kapalı.</span>
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
  );
}
