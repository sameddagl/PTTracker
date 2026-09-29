"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, CalendarDays, Settings, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/bugun", label: "Bugün", icon: CalendarCheck },
  { href: "/danisanlar", label: "Danışanlar", icon: Users },
  { href: "/takvim", label: "Takvim", icon: CalendarDays },
  { href: "/odemeler", label: "Ödemeler", icon: Wallet },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
] as const;

type Badges = Partial<Record<(typeof ITEMS)[number]["href"], number>>;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav({ badges = {} }: { badges?: Badges }) {
  const isActive = useIsActive();
  return (
    <nav className="flex flex-col gap-1" aria-label="Ana menü">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            isActive(href) && "bg-accent text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          <span className="flex-1">{label}</span>
          {!!badges[href] && (
            <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
              {badges[href]}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav({ badges = {} }: { badges?: Badges }) {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Ana menü"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              aria-label={badges[href] ? `${label}, ${badges[href]} bekleyen` : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground",
                isActive(href) && "text-primary",
              )}
            >
              <span className="relative">
                <Icon className="size-5" aria-hidden />
                {!!badges[href] && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 font-semibold text-primary-foreground tabular-nums">
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
