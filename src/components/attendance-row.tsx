"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Check, StickyNote } from "lucide-react";
import { toast } from "sonner";
import type { CalendarAttendee } from "@/db/lessons";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { markAttendanceAction } from "@/app/(app)/bugun/actions";
import { addLessonNoteAction } from "@/app/(app)/danisanlar/[id]/progress-actions";
import { useConfirm } from "@/components/confirm-dialog";

type Status = CalendarAttendee["status"];

const OPTIONS: { status: Status; label: string; active: string }[] = [
  { status: "attended", label: "Geldi", active: "border-success-strong bg-success-strong text-background" },
  { status: "no_show", label: "Gelmedi", active: "border-destructive bg-destructive text-background" },
  { status: "late_cancel", label: "Geç iptal", active: "border-warning-strong bg-warning-strong text-background" },
  { status: "cancelled", label: "İptal", active: "border-foreground bg-foreground text-background" },
];

export function AttendanceRow({ attendee }: { attendee: CalendarAttendee }) {
  const [optimistic, setOptimistic] = useOptimistic(attendee.status);
  const [pending, startTransition] = useTransition();
  // Updated from the action result, so the count changes without waiting for the page refresh.
  const [remaining, setRemaining] = useState(attendee.remaining);
  const [makeupUsed, setMakeupUsed] = useState(attendee.makeupUsed);
  const [noting, startNote] = useTransition();
  const { ask, dialog } = useConfirm();

  async function note() {
    const body = await ask({
      title: `${attendee.name} · ders notu`,
      input: { label: "Not", placeholder: "Bugün neler yaptınız, dikkat edilecek bir şey…", maxLength: 2000 },
      confirmLabel: "Kaydet",
    });
    if (!body) return;
    startNote(async () => {
      const res = await addLessonNoteAction(attendee.id, body);
      if (res.ok) toast.success("Not kaydedildi", { description: "Danışanın Notlar sekmesinde görünür." });
      else toast.error(res.error);
    });
  }

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
      {dialog}
      <div className="flex items-center justify-between gap-3">
        <Link href={`/danisanlar/${attendee.clientId}`} className="flex min-w-0 items-center gap-2 font-medium hover:underline">
          <Avatar name={attendee.name} size="sm" />
          <span className="truncate">{attendee.name}</span>
          {attendee.confirmed && optimistic === "scheduled" && (
            <Badge variant="success" className="shrink-0">
              <Check aria-hidden />
              Onayladı
            </Badge>
          )}
        </Link>
        {attendee.alert && (
          <button
            type="button"
            onClick={() => toast.warning(attendee.name, { description: attendee.alert, duration: 10000 })}
            aria-label={`${attendee.name} için uyarı notu: ${attendee.alert}`}
            className="-ml-2 flex size-8 shrink-0 items-center justify-center rounded-full text-warning-strong hover:bg-warning/10"
          >
            <AlertTriangle className="size-4" aria-hidden />
          </button>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <span className="text-xs text-muted-foreground tabular-nums">{remaining === null ? "Paketsiz" : `${remaining} ders kaldı`}</span>
          <button
            type="button"
            onClick={note}
            disabled={noting}
            aria-label={`${attendee.name} için ders notu ekle`}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60"
          >
            <StickyNote className="size-4" aria-hidden />
          </button>
        </span>
      </div>
      <div role="group" aria-label={`${attendee.name} yoklama`} className="grid grid-cols-4 gap-2">
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
                "h-11 rounded-full border text-xs font-medium transition-colors disabled:opacity-70 sm:text-sm",
                active ? o.active : "border-transparent bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground",
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
