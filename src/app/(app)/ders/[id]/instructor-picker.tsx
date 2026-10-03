"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { changeInstructorAction } from "./actions";

/** Owner: who teaches this lesson; for a series, this one or all that follow. */
export function InstructorPicker({
  lessonId,
  current,
  instructors,
  series,
}: {
  lessonId: string;
  current: string | null;
  instructors: { id: string; name: string }[];
  series: boolean;
}) {
  const [value, setValue] = useState(current ?? instructors[0]?.id ?? "");
  const [following, setFollowing] = useState(false);
  const [pending, start] = useTransition();
  const changed = value !== current;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-48 flex-1 flex-col gap-2 text-sm font-medium">
          Eğitmen
          <NativeSelect value={value} onChange={(e) => setValue(e.target.value)}>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </NativeSelect>
        </label>
        <Button
          type="button"
          variant="outline"
          disabled={!changed}
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await changeInstructorAction(lessonId, value, following);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Eğitmen değişti", {
                description: res.told > 0 ? `${res.told} danışana bildirim gitti.` : undefined,
              });
            })
          }
        >
          Değiştir
        </Button>
      </div>
      {series && changed && (
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={following} onChange={(e) => setFollowing(e.target.checked)} className="size-4 accent-foreground" />
          Bundan sonraki tekrarlarda da
        </label>
      )}
      {changed && <p className="text-xs text-muted-foreground">Bu derse yazılı danışanlara kimin gireceği bildirim olarak gider.</p>}
    </div>
  );
}
