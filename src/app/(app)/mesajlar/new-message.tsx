"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, SquarePen, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const fold = (s: string) => s.toLocaleLowerCase("tr").normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** "Yeni mesaj": pick any active client to open (or start) their conversation. */
export function NewMessage({ clients }: { clients: { id: string; fullName: string }[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = fold(query.trim());
  const shown = q ? clients.filter((c) => fold(c.fullName).includes(q)) : clients;

  return (
    <>
      <Button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="new-message-panel">
        {open ? <X /> : <SquarePen />}
        <span className="max-sm:sr-only">{open ? "Kapat" : "Yeni mesaj"}</span>
      </Button>
      {open && (
        <div
          id="new-message-panel"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="absolute inset-x-0 top-full z-10 mt-3 overflow-hidden surface">
          <div className="relative border-b p-2">
            <Search className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Danışan ara"
              aria-label="Danışan ara"
              className="rounded-full pl-10"
            />
          </div>
          {clients.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Aktif danışanın yok.{" "}
              <Link href="/danisanlar/yeni" className="font-medium text-foreground underline underline-offset-4">
                Danışan ekle
              </Link>
            </p>
          ) : shown.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">“{query}” ile eşleşen danışan yok.</p>
          ) : (
            <ul className="max-h-80 divide-y overflow-y-auto">
              {shown.map((c) => (
                <li key={c.id}>
                  <Link href={`/mesajlar/${c.id}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50">
                    <Avatar name={c.fullName} size="sm" />
                    <span className="min-w-0 flex-1 truncate font-medium">{c.fullName}</span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
