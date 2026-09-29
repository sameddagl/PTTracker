"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PROFILE_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { setProfileImageAction } from "./actions";

type Kind = "avatar" | "cover";

// Avatar: square crop. Cover: wide crop. Both re-encoded to WebP in the
// browser, so phone photos (often 5–10 MB) upload as ~100 KB.
const TARGET: Record<Kind, { width: number; height: number }> = {
  avatar: { width: 512, height: 512 },
  cover: { width: 1600, height: 600 },
};

async function toWebp(file: File, kind: Kind): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = TARGET[kind];
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const sw = width / scale;
  const sh = height / scale;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("encode failed");
  return blob;
}

export function ImageUpload({
  kind,
  trainerId,
  url: initialUrl,
  label,
}: {
  kind: Kind;
  trainerId: string;
  url: string | null;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [pending, startTransition] = useTransition();

  function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Bir fotoğraf seç.");
    startTransition(async () => {
      try {
        const blob = await toWebp(file, kind);
        const path = `${trainerId}/${kind}-${Date.now()}.webp`;
        const { error } = await createClient()
          .storage.from(PROFILE_BUCKET)
          .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw error;
        const res = await setProfileImageAction(kind, path);
        if (!res.ok) throw new Error("save failed");
        setUrl(URL.createObjectURL(blob));
        toast.success("Fotoğraf güncellendi");
      } catch (e) {
        console.error(e);
        toast.error("Fotoğraf yüklenemedi. Tekrar dene.");
      } finally {
        if (input.current) input.current.value = "";
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await setProfileImageAction(kind, null);
      if (res.ok) setUrl(null);
      else toast.error("Fotoğraf kaldırılamadı.");
    });
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={pending}
        aria-label={`${label} seç`}
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden border bg-muted text-muted-foreground transition-opacity hover:opacity-90 disabled:opacity-60",
          kind === "avatar" ? "size-20 rounded-full" : "aspect-[8/3] w-40 rounded-lg",
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob/storage preview
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <Camera className="size-5" aria-hidden />
        )}
      </button>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? "Yükleniyor…" : url ? "Değiştir" : "Yükle"}
          </Button>
          {url && (
            <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={remove} aria-label={`${label} kaldır`}>
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  );
}
