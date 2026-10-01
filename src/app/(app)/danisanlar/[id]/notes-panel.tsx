"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Eye, EyeOff, Pencil, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/page-header";
import { Switch } from "@/components/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addNoteAction, deleteNoteAction, setNoteVisibilityAction } from "./progress-actions";

export type NoteItem = { id: string; body: string; visibleToClient: boolean; when: string; lesson: string | null };

export function NotesPanel({
  clientId,
  firstName,
  notes,
  profileNote,
  healthNote,
  editHref,
  archived,
}: {
  clientId: string;
  firstName: string;
  notes: NoteItem[];
  profileNote: string | null;
  healthNote: string | null;
  editHref: string;
  archived: boolean;
}) {
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, startSave] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { confirm, dialog } = useConfirm();

  function save() {
    startSave(async () => {
      const res = await addNoteAction(clientId, text, visible);
      if (!res.ok) return void toast.error(res.error);
      setText("");
      setVisible(false);
      toast.success(visible ? `Not kaydedildi, ${firstName} de görecek` : "Not kaydedildi");
    });
  }

  function toggle(n: NoteItem) {
    setBusy(n.id);
    start(async () => {
      const res = await setNoteVisibilityAction(n.id, !n.visibleToClient);
      if (!res.ok) toast.error(res.error);
      else toast(n.visibleToClient ? "Not artık sadece sende" : `${firstName} bu notu sayfasında görecek`);
    });
  }

  async function remove(n: NoteItem) {
    if (!(await confirm({ title: "Not silinsin mi?", body: n.body.length > 120 ? `${n.body.slice(0, 119)}…` : n.body, confirmLabel: "Sil", destructive: true })))
      return;
    setBusy(n.id);
    start(async () => {
      const res = await deleteNoteAction(n.id);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {dialog}
      {(healthNote || profileNote) && (
        <div className="flex flex-col gap-3">
          {healthNote && (
            <div className="flex gap-3 rounded-2xl bg-warning/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-strong" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Uyarı notu</p>
                <p className="whitespace-pre-wrap">{healthNote}</p>
                <p className="mt-1 text-xs text-muted-foreground">Ders ve yoklama ekranlarında adının yanında ⚠ olarak görünür.</p>
              </div>
            </div>
          )}
          {profileNote && (
            <div className="surface p-4 text-sm">
              <p className="mb-1 text-xs text-muted-foreground">Danışan bilgilerindeki not</p>
              <p className="whitespace-pre-wrap">{profileNote}</p>
            </div>
          )}
        </div>
      )}

      {!archived && (
        <section aria-label="Yeni not" className="flex flex-col gap-3 surface p-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={`${firstName} hakkında not yaz: bugünkü ders, dikkat edilecek bir şey, hedef…`}
            aria-label="Not"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-1 text-sm">
              <Switch on={visible} onChange={setVisible} label={`${firstName} de görsün`} />
              <span>{firstName} de görsün</span>
            </label>
            <Button type="button" onClick={save} loading={saving} disabled={!text.trim()}>
              Notu kaydet
            </Button>
          </div>
        </section>
      )}

      {notes.length === 0 ? (
        <EmptyState icon={<StickyNote />} title="Henüz not yok">
          Yoklamada “Not” ile derse not düşebilir ya da buraya yazabilirsin. {!healthNote && (
            <>
              Sağlıkla ilgili kalıcı bir uyarı için{" "}
              <Link href={editHref} className="underline underline-offset-4">
                uyarı notu ekle
              </Link>
              .
            </>
          )}
        </EmptyState>
      ) : (
        <ul className="divide-y overflow-hidden surface">
          {notes.map((n) => (
            <li key={n.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>{n.when}</span>
                {n.lesson && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                    <CalendarClock className="size-3" aria-hidden />
                    {n.lesson}
                  </span>
                )}
                {n.visibleToClient && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-lime-foreground">
                    <Eye className="size-3" aria-hidden />
                    {firstName} görüyor
                  </span>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{n.body}</p>
              {!archived && (
                <div className="-ml-2 flex gap-1">
                  <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" loading={pending && busy === n.id} onClick={() => toggle(n)}>
                    {n.visibleToClient ? <EyeOff /> : <Eye />}
                    {n.visibleToClient ? "Gizle" : `${firstName} görsün`}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" disabled={pending} onClick={() => remove(n)}>
                    <Trash2 />
                    Sil
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {healthNote && !archived && (
        <Button asChild variant="ghost" size="sm" className="self-start text-muted-foreground">
          <Link href={editHref}>
            <Pencil />
            Uyarı notunu düzenle
          </Link>
        </Button>
      )}
    </div>
  );
}
