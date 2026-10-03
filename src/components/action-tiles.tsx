import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ActionTileItem = { href: string; icon: ReactNode; title: string; primary?: boolean };

/** Shortcuts as labelled tiles (icon + title), so a phone never shows an unexplained icon button. */
export function ActionTiles({ items, className }: { items: ActionTileItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Kısayollar" className={cn("grid grid-cols-3 gap-3", className)}>
      {items.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="flex min-h-24 flex-col items-start justify-between gap-3 surface p-3 transition-colors hover:bg-muted/50 sm:p-4"
        >
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-full [&_svg]:size-5",
              a.primary ? "bg-lime text-lime-foreground" : "bg-muted text-foreground",
            )}
            aria-hidden
          >
            {a.icon}
          </span>
          <span className="text-sm leading-tight font-semibold">{a.title}</span>
        </Link>
      ))}
    </nav>
  );
}
