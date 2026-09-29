"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
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
import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import { PriceTag } from "@/components/price-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SESSION_TYPE_LABELS, formatTRY } from "@/lib/format";
import { cn } from "@/lib/utils";
import { reorderTemplatesAction, toggleTemplateAction } from "./actions";

export type TemplateRow = {
  id: string;
  name: string;
  sessionType: keyof typeof SESSION_TYPE_LABELS;
  sessionCount: number;
  validityDays: number | null;
  makeupAllowance: number;
  price: string | null;
  compareAtPrice: string | null;
  installmentPrice: string | null;
  installments: number;
  isActive: boolean;
  isPublic: boolean;
};

export function TemplateList({ templates }: { templates: TemplateRow[] }) {
  const [items, setItems] = useOptimistic(templates);
  // A stable id keeps dnd-kit's generated aria ids the same on server and client.
  const dndId = useId();
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((t) => t.id === active.id);
    const to = items.findIndex((t) => t.id === over.id);
    const next = arrayMove(items, from, to);
    startTransition(async () => {
      setItems(next);
      try {
        await reorderTemplatesAction(next.map((t) => t.id));
      } catch {
        toast.error("Sıralama kaydedilemedi, tekrar dene.");
      }
    });
  }

  return (
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
          onDragStart: () => "Paket seçildi.",
          onDragOver: ({ over }) => (over ? "Yeni konum." : ""),
          onDragEnd: () => "Paket bırakıldı.",
          onDragCancel: () => "Taşıma iptal edildi.",
        },
      }}
    >
      <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {items.map((t) => (
            <SortableRow key={t.id} template={t} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ template: t }: { template: TemplateRow }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: t.id });
  const [toggling, startToggle] = useTransition();
  const [active, setActive] = useState(t.isActive);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-card py-2 pr-2 pl-1",
        isDragging && "relative z-10 shadow-lg ring-2 ring-ring/40",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`${t.name} sırasını değiştir`}
        className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted active:cursor-grabbing md:size-9"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <Link href={`/paketler/${t.id}`} className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg py-1">
        <span className={cn("truncate font-medium", !active && "text-muted-foreground line-through")}>{t.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {SESSION_TYPE_LABELS[t.sessionType]} · {t.sessionCount} ders
          {t.validityDays ? ` · ${t.validityDays} gün` : " · süresiz"}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {t.price && <PriceTag price={t.price} compareAtPrice={t.compareAtPrice} size="sm" align="start" />}
          {t.installments > 1 && t.installmentPrice && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {t.installments} taksit {formatTRY(t.installmentPrice)}
            </span>
          )}
          {!active ? <Badge variant="secondary">Pasif</Badge> : !t.isPublic && <Badge variant="outline">Gizli</Badge>}
        </span>
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        loading={toggling}
        onClick={() =>
          startToggle(async () => {
            await toggleTemplateAction(t.id, !active);
            setActive(!active);
          })
        }
      >
        {active ? "Pasifleştir" : "Aktifleştir"}
      </Button>
    </li>
  );
}
