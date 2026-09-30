"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The header links behind a "Menü" button where they don't fit in the bar. */
export function SiteMenu({ nav, className }: { nav: { href: string; label: string }[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div ref={ref} className={className}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={open ? "Menüyü kapat" : "Menü"}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X /> : <Menu />}
      </Button>
      <nav
        id="site-menu"
        aria-label="Sayfa"
        hidden={!open}
        className={cn("absolute inset-x-0 top-16 border-b bg-canvas px-4 pb-4 shadow-float sm:px-6", open && "anim-rise")}
      >
        <ul className="mx-auto flex max-w-6xl flex-col divide-y">
          {nav.map((n) => (
            <li key={n.href}>
              <Link href={n.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center text-base font-medium">
                {n.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/giris" onClick={() => setOpen(false)} className="flex min-h-12 items-center text-base text-muted-foreground">
              Giriş yap
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
