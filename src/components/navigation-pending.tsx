"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ComponentProps, type ReactNode } from "react";
import Link, { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

// Links that only change the page's search params (week, month, instructor,
// tab) stay on the same route, so its loading.tsx doesn't show and the old
// screen just sits there until the server answers. A PendingLink reports its
// pending state here: the page content fades and a thin bar runs along the top.

const PendingContext = createContext<(on: boolean) => void>(() => {});

export function NavigationPending({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const pending = count > 0;
  // Stable, so a reporting link's effect doesn't re-run on every render.
  const report = useCallback((on: boolean) => setCount((n) => Math.max(0, n + (on ? 1 : -1))), []);
  return (
    <PendingContext.Provider value={report}>
      {pending && (
        <div role="progressbar" aria-label="Yükleniyor" className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-lime/20">
          <div className="nav-progress h-full w-1/3 bg-lime" />
        </div>
      )}
      <div aria-busy={pending} className={cn("transition-opacity duration-150", pending && "pointer-events-none opacity-60")}>
        {children}
      </div>
    </PendingContext.Provider>
  );
}

function Reporter() {
  const { pending } = useLinkStatus();
  const report = useContext(PendingContext);
  useEffect(() => {
    if (!pending) return;
    report(true);
    return () => report(false);
  }, [pending, report]);
  return null;
}

/** A Link for same-page switches (filters, tabs, week or month arrows) that shows the page is loading. */
export function PendingLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <Reporter />
    </Link>
  );
}
