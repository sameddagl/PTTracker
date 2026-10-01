"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Bell, CalendarDays, Dumbbell, MessagesSquare, Salad, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// The client's page in tabs, with a floating tab bar like the trainer app's.
// The URL hash picks the tab, so links from notifications (#mesajlar,
// #paketler…) open the right one and scroll to the section.

const ICONS = { dersler: CalendarDays, ilerleme: TrendingUp, program: Dumbbell, beslenme: Salad, mesajlar: MessagesSquare, bildirimler: Bell };

/** `offBar` tabs are reached from elsewhere (the bell in the header), not the tab bar. */
export type PortalTab = { id: keyof typeof ICONS; label: string; badge?: number; anchors?: string[]; offBar?: boolean };

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const getHash = () => window.location.hash.slice(1);

export function PortalTabs({ tabs, panels }: { tabs: PortalTab[]; panels: Partial<Record<PortalTab["id"], ReactNode>> }) {
  const hash = useSyncExternalStore(subscribe, getHash, () => "");
  const active = tabs.find((t) => t.id === hash || t.anchors?.includes(hash))?.id ?? tabs[0].id;

  // A section anchor (not a tab name) scrolls to that section once its tab shows.
  useEffect(() => {
    if (!hash || tabs.some((t) => t.id === hash)) return;
    document.getElementById(hash)?.scrollIntoView({ block: "start" });
  }, [hash, tabs]);

  function open(id: PortalTab["id"]) {
    if (id === active) return void window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={t.offBar ? undefined : `tab-${t.id}`} aria-label={t.offBar ? t.label : undefined} hidden={t.id !== active} className="flex flex-col gap-8">
          {panels[t.id]}
        </div>
      ))}
      <nav aria-label="Sayfa bölümleri" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40">
        <ul role="tablist" className="mx-auto flex max-w-md gap-1 rounded-full bg-[#1d1d1f] p-1.5 shadow-float ring-1 ring-white/10 dark:bg-[#1c1c1f]">
          {tabs.filter((t) => !t.offBar).map((t) => {
            const Icon = ICONS[t.id];
            const on = t.id === active;
            return (
              <li key={t.id} role="presentation" className={cn("transition-[flex-grow] duration-200", on ? "grow-[2.4]" : "grow")}>
                <button
                  type="button"
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={on}
                  aria-controls={`panel-${t.id}`}
                  aria-label={t.badge ? `${t.label}, ${t.badge} yeni` : t.label}
                  onClick={() => open(t.id)}
                  className={cn(
                    "flex h-12 w-full items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-white/65 transition-colors",
                    on ? "bg-lime text-lime-foreground" : "hover:text-white",
                  )}
                >
                  <span className="relative">
                    <Icon className="size-5" aria-hidden />
                    {!!t.badge && (
                      <span
                        className={cn(
                          "absolute -top-1.5 -right-2.5 min-w-5 rounded-full px-1 text-center text-xs leading-5 font-semibold tabular-nums",
                          on ? "bg-[#1d1d1f] text-white" : "bg-lime text-lime-foreground",
                        )}
                      >
                        {t.badge}
                      </span>
                    )}
                  </span>
                  {on && <span className="truncate">{t.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
