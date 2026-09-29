"use client";

import { useCallback, useId, useOptimistic, useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INTAKE_TYPE_LABELS } from "@/lib/intake";
import { cn } from "@/lib/utils";
import { deleteIntakeFieldAction, reorderIntakeFieldsAction } from "./actions";
import { FieldEditor, NEW_FIELD, type EditableField } from "./field-editor";

const FIXED = ["Ad soyad", "Telefon (WhatsApp)", "E-posta"];

type Row = EditableField & { id: string };

export function FieldList({ fields }: { fields: Row[] }) {
  // Which row is being edited: a field id, "new", or nothing.
  const [editing, setEditing] = useState<string | null>(null);
  const [items, setItems] = useOptimistic(fields);
  const [, startTransition] = useTransition();
  const close = useCallback(() => setEditing(null), []);
  // A stable id keeps dnd-kit's generated aria ids the same on server and client.
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const next = arrayMove(
      items,
      items.findIndex((f) => f.id === active.id),
      items.findIndex((f) => f.id === over.id),
    );
    startTransition(async () => {
      setItems(next);
      try {
        await reorderIntakeFieldsAction(next.map((f) => f.id));
      } catch {
        toast.error("Sıralama kaydedilemedi, tekrar dene.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y overflow-hidden surface">
        {FIXED.map((label) => (
          <li key={label} className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            <span className="flex-1">{label}</span>
            <span className="text-xs">her formda</span>
          </li>
        ))}
      </ul>

      {items.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">Sorular formda bu sırayla görünür. Sıralamak için tutamaktan sürükle.</p>
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            accessibility={{
              screenReaderInstructions: {
                draggable: "Taşımak için boşluk tuşuna bas, oklarla yerini seç, bırakmak için tekrar boşluk tuşuna bas.",
              },
              announcements: {
                onDragStart: () => "Soru seçildi.",
                onDragOver: ({ over }) => (over ? "Yeni konum." : ""),
                onDragEnd: () => "Soru bırakıldı.",
                onDragCancel: () => "Taşıma iptal edildi.",
              },
            }}
          >
            <SortableContext items={items.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-2">
                {items.map((f) =>
                  editing === f.id ? (
                    <li key={f.id}>
                      <FieldEditor initial={f} onDone={close} />
                    </li>
                  ) : (
                    <SortableField key={f.id} field={f} onEdit={() => setEditing(f.id)} />
                  ),
                )}
              </ul>
            </SortableContext>
          </DndContext>
        </>
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

function SortableField({ field: f, onEdit }: { field: Row; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: f.id });
  const [deleting, startDelete] = useTransition();

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-2 surface py-2 pr-2 pl-1", isDragging && "relative z-10 shadow-float ring-2 ring-ring/40")}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`${f.label} sırasını değiştir`}
        className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:cursor-grabbing md:size-10"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", !f.isActive && "text-muted-foreground line-through")}>{f.label}</p>
        <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {INTAKE_TYPE_LABELS[f.type]}
          {f.unit && ` · ${f.unit}`}
          {f.required && <Badge variant="outline">Zorunlu</Badge>}
          {f.isHealth && <Badge variant="secondary">Sağlık</Badge>}
          {!f.isActive && <Badge variant="secondary">Gizli</Badge>}
        </p>
      </div>
      <Button type="button" size="icon" variant="ghost" aria-label={`${f.label} düzenle`} onClick={onEdit}>
        <Pencil />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        loading={deleting}
        aria-label={`${f.label} sil`}
        onClick={() => {
          if (!window.confirm(`"${f.label}" sorusu silinsin mi? Önceki cevaplar danışan kayıtlarında kalır.`)) return;
          startDelete(() => deleteIntakeFieldAction(f.id));
        }}
      >
        <Trash2 className="text-muted-foreground" />
      </Button>
    </li>
  );
}
