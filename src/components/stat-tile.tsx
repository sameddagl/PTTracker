import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** A number with a label, for the summary rows on Bugün and Ödemeler. `tone="lime"` marks the one that matters most. */
export function StatTile({
  label,
  value,
  hint,
  icon,
  href,
  tone = "default",
  className: extra,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  href?: string;
  tone?: "default" | "lime" | "ink";
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className={cn("text-xs font-medium", tone === "default" ? "text-muted-foreground" : "opacity-75")}>{label}</p>
        {icon && <span className="[&_svg]:size-4 opacity-70">{icon}</span>}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className={cn("mt-1 truncate text-xs", tone === "default" ? "text-muted-foreground" : "opacity-75")}>{hint}</p>}
    </>
  );
  const className = cn(
    "block min-w-0 rounded-2xl p-4 transition-colors",
    tone === "lime" && "bg-lime text-lime-foreground",
    tone === "ink" && "bg-[#1d1d1f] text-white dark:bg-card dark:ring-1 dark:ring-border",
    tone === "default" && "surface",
    href && tone === "default" && "hover:bg-muted/60",
    extra,
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
