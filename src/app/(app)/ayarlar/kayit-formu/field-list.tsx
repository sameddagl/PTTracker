"use client";

import { useCallback, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INTAKE_TYPE_LABELS } from "@/lib/intake";
import { deleteIntakeFieldAction, moveIntakeFieldAction } from "./actions";
import { FieldEditor, NEW_FIELD, type EditableField } from "./field-editor";

const FIXED = ["Ad soyad", "Telefon (WhatsApp)", "E-posta"];

export function FieldList({ fields }: { fields: (EditableField & { id: string })[] }) {
  // Which row is being edited: a field id, "new", or nothing.
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const close = useCallback(() => setEditing(null), []);

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y rounded-xl border">
        {FIXED.map((label) => (
          <li key={label} className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            <span className="flex-1">{label}</span>
            <span className="text-xs">her formda</span>
          </li>
        ))}
      </ul>

      {fields.length > 0 && (
        <ul className="flex flex-col gap-2">
          {fields.map((f, i) =>
            editing === f.id ? (
              <li key={f.id}>
                <FieldEditor initial={f} onDone={close} />
              </li>
            ) : (
              <li key={f.id} className="flex items-center gap-2 rounded-xl border py-2 pr-2 pl-4">
                <div className="min-w-0 flex-1">
                  <p className={f.isActive ? "truncate text-sm font-medium" : "truncate text-sm font-medium text-muted-foreground line-through"}>
                    {f.label}
                  </p>
                  <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    {INTAKE_TYPE_LABELS[f.type]}
                    {f.unit && ` · ${f.unit}`}
                    {f.required && <Badge variant="outline">Zorunlu</Badge>}
                    {f.isHealth && <Badge variant="secondary">Sağlık</Badge>}
                    {!f.isActive && <Badge variant="secondary">Gizli</Badge>}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={pending || i === 0}
                  aria-label={`${f.label} yukarı taşı`}
                  onClick={() => startTransition(() => moveIntakeFieldAction(f.id, "up"))}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={pending || i === fields.length - 1}
                  aria-label={`${f.label} aşağı taşı`}
                  onClick={() => startTransition(() => moveIntakeFieldAction(f.id, "down"))}
                >
                  <ArrowDown />
                </Button>
                <Button type="button" size="icon" variant="ghost" aria-label={`${f.label} düzenle`} onClick={() => setEditing(f.id)}>
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={pending}
                  aria-label={`${f.label} sil`}
                  onClick={() => {
                    if (!window.confirm(`"${f.label}" sorusu silinsin mi? Önceki cevaplar danışan kayıtlarında kalır.`)) return;
                    startTransition(() => deleteIntakeFieldAction(f.id));
                  }}
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              </li>
            ),
          )}
        </ul>
      )}

      {editing === "new" ? (
        <FieldEditor initial={NEW_FIELD} onDone={close} />
      ) : (
        <Button type="button" variant="outline" className="self-start" onClick={() => setEditing("new")}>
          <Plus />
          Soru ekle
        </Button>
      )}
    </div>
  );
}
