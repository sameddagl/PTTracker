"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { TodayAttendee } from "@/db/queries";
import { cn } from "@/lib/utils";
import { markAttendanceAction } from "./actions";

type Status = TodayAttendee["status"];

const OPTIONS: { status: Status; label: string; active: string }[] = [
  { status: "attended", label: "Geldi", active: "border-emerald-600 bg-emerald-600 text-white" },
  { status: "no_show", label: "Gelmedi", active: "border-destructive bg-destructive text-white" },
  { status: "late_cancel", label: "Geç iptal", active: "border-amber-500 bg-amber-500 text-white" },
  { status: "cancelled", label: "İptal", active: "border-foreground/40 bg-muted text-foreground" },
];

export function AttendanceRow({ attendee }: { attendee: TodayAttendee }) {
  const [optimistic, setOptimistic] = useOptimistic(attendee.status);
  const [pending, startTransition] = useTransition();
  // Updated from the action result, so the count changes without waiting for the page refresh.
  const [remaining, setRemaining] = useState(attendee.remaining);
  const [makeupUsed, setMakeupUsed] = useState(attendee.makeupUsed);

  function mark(status: Status) {
    // Tapping the active option again undoes it.
    const next = optimistic === status ? "scheduled" : status;
    startTransition(async () => {
      setOptimistic(next);
      const res = await markAttendanceAction(attendee.id, next);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      setRemaining(res.remaining);
      setMakeupUsed(res.makeupUsed);
      if (res.status === "late_cancel") {
        toast(res.makeupUsed ? "Telafi hakkı kullanıldı, ders yanmadı." : "Geç iptal: ders paketten düştü.", {
          description: res.remaining !== null ? `${res.remaining} ders kaldı` : undefined,
        });
      } else if (res.remaining !== null && res.remaining <= 2 && (res.status === "attended" || res.status === "no_show")) {
        toast.warning(res.remaining === 0 ? `${attendee.name}: paket bitti` : `${attendee.name}: ${res.remaining} ders kaldı`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Link href={`/danisanlar/${attendee.clientId}`} className="truncate font-medium hover:underline">
          {attendee.name}
        </Link>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {remaining === null ? "Paketsiz" : `${remaining} ders kaldı`}
        </span>
      </div>
      <div role="group" aria-label={`${attendee.name} yoklama`} className="grid grid-cols-4 gap-1.5">
        {OPTIONS.map((o) => {
          const active = optimistic === o.status;
          return (
            <button
              key={o.status}
              type="button"
              onClick={() => mark(o.status)}
              aria-pressed={active}
              disabled={pending}
              className={cn(
                "h-10 rounded-lg border text-xs font-medium transition-colors disabled:opacity-70 sm:text-sm",
                active ? o.active : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {optimistic === "late_cancel" && makeupUsed && !pending && (
        <p className="text-xs text-muted-foreground">Telafi hakkı kullanıldı, ders yanmadı.</p>
      )}
    </div>
  );
}
