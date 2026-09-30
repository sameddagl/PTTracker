"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markAllAttendedAction } from "./actions";

export function AllAttended({ attendeeIds }: { attendeeIds: string[] }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await markAllAttendedAction(attendeeIds);
          if (res.ok) toast.success(`${res.marked} kişi geldi olarak işaretlendi`);
          else toast.error(res.error);
        })
      }
    >
      <CheckCheck />
      Hepsi geldi
    </Button>
  );
}
