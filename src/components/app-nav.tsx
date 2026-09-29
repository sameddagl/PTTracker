"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, CalendarDays, Package, Settings, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/bugun", label: "Bugün", icon: CalendarCheck },
  { href: "/danisanlar", label: "Danışanlar", icon: Users },
  { href: "/takvim", label: "Takvim", icon: CalendarDays },
  { href: "/odemeler", label: "Ödemeler", icon: Wallet },
  { href: "/paketler", label: "Paketler", icon: Package, desktopOnly: true },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
] as const;

// Five tabs fit a phone's bottom bar; packages live under Ayarlar there.
const MOBILE_ITEMS = ITEMS.filter((i) => !("desktopOnly" in i));

type Badges = Partial<Record<(typeof ITEMS)[number]["href"], number>>;

/**
 * Which tab is current. A tapped tab lights up right away, before the new
 * route has rendered, so switching tabs never feels stuck.
 */
function useActiveTab() {
  const pathname = usePathname();
  // Remembered with the path it was tapped on; once the route changes it no longer applies.
  const [tapped, setTapped] = useState<{ href: string; on: string } | null>(null);
  const current = tapped?.on === pathname ? tapped.href : pathname;
  return {
    isActive: (href: string) => current === href || current.startsWith(`${href}/`),
    onTap: (href: string) => () => setTapped({ href, on: pathname }),
  };
}

export function SideNav({ badges = {} }: { badges?: Badges }) {
  const { isActive, onTap } = useActiveTab();
  return (
    <nav className="flex flex-col gap-1" aria-label="Ana menü">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onTap(href)}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            isActive(href) && "bg-accent text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          <span className="flex-1">{label}</span>
          {!!badges[href] && (
            <span className="rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground tabular-nums">
              {badges[href]}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav({ badges = {} }: { badges?: Badges }) {
  const { isActive, onTap } = useActiveTab();
  return (
    <nav
      aria-label="Ana menü"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {MOBILE_ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              onClick={onTap(href)}
              aria-current={isActive(href) ? "page" : undefined}
              aria-label={badges[href] ? `${label}, ${badges[href]} bekleyen` : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-xs font-medium text-muted-foreground",
                isActive(href) && "text-primary",
              )}
            >
              <span className="relative">
                <Icon className="size-5" aria-hidden />
                {!!badges[href] && (
                  <span className="absolute -top-2 -right-3 min-w-5 rounded-full bg-primary px-1 text-center text-xs leading-5 font-semibold text-primary-foreground tabular-nums">
                    {badges[href]}
                  </span>
                )}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
