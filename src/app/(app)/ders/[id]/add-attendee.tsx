"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { addAttendeeAction } from "./actions";

export function AddAttendee({ lessonId, clients }: { lessonId: string; clients: { id: string; fullName: string }[] }) {
  const [clientId, setClientId] = useState("");
  const [pending, start] = useTransition();
  if (clients.length === 0) return null;
  return (
    <div className="flex gap-2">
      <NativeSelect value={clientId} onChange={(e) => setClientId(e.target.value)} aria-label="Eklenecek danışan" className="flex-1">
        <option value="">Danışan ekle…</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.fullName}
          </option>
        ))}
      </NativeSelect>
      <Button
        type="button"
        variant="outline"
        disabled={!clientId}
        loading={pending}
        onClick={() =>
          start(async () => {
            const res = await addAttendeeAction(lessonId, clientId);
            if (res.ok) setClientId("");
            else toast.error(res.error);
          })
        }
      >
        <UserPlus />
        Ekle
      </Button>
    </div>
  );
}
