import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Loading placeholders shaped like the real screens, so a tab switch shows the
// new page's frame at once and fills in when the data arrives.

/** Wraps a skeleton so assistive tech hears "loading" once instead of empty boxes. */
export function LoadingScreen({ label = "Yükleniyor", children }: { label?: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

/** Page title (real text when known) with a placeholder description and action. */
export function HeaderSkeleton({ title, back, action = true }: { title?: string; back?: boolean; action?: boolean }) {
  return (
    <>
      {back && <Skeleton className="mb-3 h-5 w-24" />}
      <header className="mb-8 flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {title ? <h1 className="text-3xl leading-tight font-semibold">{title}</h1> : <Skeleton className="h-9 w-52" />}
          <Skeleton className="h-4 w-36" />
        </div>
        {action && <Skeleton className="size-11 shrink-0 rounded-full md:h-10 md:w-28" />}
      </header>
    </>
  );
}

export function SectionTitleSkeleton() {
  return <Skeleton className="mb-3 h-4 w-28" />;
}

/** A bordered list of rows with a title line and a detail line. */
export function ListSkeleton({ rows = 5, trailing = true }: { rows?: number; trailing?: boolean }) {
  return (
    <ul className="divide-y overflow-hidden surface">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4" style={{ width: `${55 - (i % 3) * 10}%` }} />
            <Skeleton className="h-3 w-2/5" />
          </div>
          {trailing && <Skeleton className="h-6 w-16 rounded-full" />}
        </li>
      ))}
    </ul>
  );
}

/** Stacked cards, e.g. today's lessons. */
export function CardsSkeleton({ count = 3, lines = 2 }: { count?: number; lines?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 surface p-4">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: lines }, (_, j) => (
            <Skeleton key={j} className="h-11 w-full rounded-full md:h-10" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Label + input pairs and a submit button. */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full rounded-xl md:h-11" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-full sm:w-44" />
    </div>
  );
}

/** Two summary tiles side by side. */
export function StatsSkeleton() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-2 surface p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
