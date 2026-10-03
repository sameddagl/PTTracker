"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { giveProgramAction } from "../actions";

/** A template someone else made: give a copy to one of your clients (it opens for editing). */
export function GiveTemplate({ templateId, clients }: { templateId: string; clients: { id: string; fullName: string }[] }) {
  const [clientId, setClientId] = useState("");
  const [pending, start] = useTransition();
  if (clients.length === 0) return <p className="text-sm text-muted-foreground">Kopyasını verebileceğin danışan yok.</p>;
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex min-w-56 flex-1 flex-col gap-2 text-sm font-medium">
        Danışana ver
        <NativeSelect value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Danışan seç</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </NativeSelect>
      </label>
      <Button type="button" disabled={!clientId} loading={pending} onClick={() => start(() => giveProgramAction(clientId, templateId))}>
        <UserPlus />
        Kopyasını ver
      </Button>
    </div>
  );
}
