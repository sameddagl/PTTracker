"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarCheck, CalendarDays, ClipboardCheck, Dumbbell, HandCoins, MessagesSquare, Package, Settings, Users, Wallet } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: typeof Users; desktopOnly?: boolean; ownerOnly?: boolean; studioOnly?: boolean };

const ITEMS: Item[] = [
  { href: "/bugun", label: "Bugün", icon: CalendarCheck },
  { href: "/danisanlar", label: "Danışanlar", icon: Users },
  { href: "/takvim", label: "Takvim", icon: CalendarDays },
  { href: "/yoklama", label: "Yoklama", icon: ClipboardCheck, desktopOnly: true },
  { href: "/mesajlar", label: "Mesajlar", icon: MessagesSquare },
  { href: "/odemeler", label: "Ödemeler", icon: Wallet, ownerOnly: true },
  { href: "/paketler", label: "Paketler", icon: Package, desktopOnly: true, ownerOnly: true },
  { href: "/hakedis", label: "Hakediş", icon: HandCoins, desktopOnly: true, studioOnly: true },
  { href: "/programlar", label: "Programlar", icon: Dumbbell, desktopOnly: true },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings, desktopOnly: true },
];

/** What the signed-in member sees: instructors don't get money or packages; Hakediş only in a studio. */
export type NavScope = { role: "owner" | "instructor"; studio: boolean };

const itemsFor = ({ role, studio }: NavScope) => ITEMS.filter((i) => (!i.ownerOnly || role === "owner") && (!i.studioOnly || studio));

// Five tabs fit a phone's bottom bar (at 375px a sixth leaves the current tab's
// label no room). On phones Ayarlar is the avatar in the top bar, and
// packages live under it.
const mobileItems = (scope: NavScope) => itemsFor(scope).filter((i) => !i.desktopOnly);

type Badges = Partial<Record<string, number>>;

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

export function SideNav({ badges = {}, scope }: { badges?: Badges; scope: NavScope }) {
  const { isActive, onTap } = useActiveTab();
  return (
    <nav className="flex flex-col gap-1" aria-label="Ana menü">
      {itemsFor(scope).map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onTap(href)}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex h-11 items-center gap-3 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            isActive(href) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          )}
        >
          <Icon className="size-[18px]" aria-hidden />
          <span className="flex-1">{label}</span>
          {!!badges[href] && (
            <span className="min-w-6 rounded-full bg-lime px-2 text-center text-xs leading-6 font-semibold text-lime-foreground tabular-nums">
              {badges[href]}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/** Phones: a floating dark pill; the current tab widens into a lime chip with its label. */
export function BottomNav({ badges = {}, scope }: { badges?: Badges; scope: NavScope }) {
  const { isActive, onTap } = useActiveTab();
  const pathname = usePathname();
  // Inside a conversation the composer takes the bottom of the screen, like any chat app.
  if (pathname.startsWith("/mesajlar/") || pathname === "/ayarlar/destek") return null;
  return (
    <nav
      aria-label="Ana menü"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 md:hidden"
    >
      <ul className="mx-auto flex max-w-md gap-1 rounded-full bg-[#1d1d1f] p-1.5 shadow-float ring-1 ring-white/10 dark:bg-[#1c1c1f]">
        {mobileItems(scope).map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className={cn("transition-[flex-grow] duration-200", active ? "grow-[2.4]" : "grow")}>
              <Link
                href={href}
                onClick={onTap(href)}
                aria-current={active ? "page" : undefined}
                aria-label={badges[href] ? `${label}, ${badges[href]} bekleyen` : label}
                className={cn(
                  "flex h-12 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-white/65 transition-colors",
                  active ? "bg-lime text-lime-foreground" : "hover:text-white",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden />
                  {!!badges[href] && (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-2.5 min-w-5 rounded-full px-1 text-center text-xs leading-5 font-semibold tabular-nums",
                        active ? "bg-[#1d1d1f] text-white" : "bg-lime text-lime-foreground",
                      )}
                    >
                      {badges[href]}
                    </span>
                  )}
                </span>
                {active && <span className="truncate">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Phones only: the app name, and the trainer's avatar that opens Ayarlar. */
export function MobileTopBar({ name, appName }: { name: string; appName: string }) {
  const { isActive, onTap } = useActiveTab();
  const active = isActive("/ayarlar") || isActive("/paketler") || isActive("/programlar") || isActive("/yardim") || isActive("/hakedis");
  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
      <Link href="/bugun" className="flex items-center gap-2 text-base font-semibold tracking-tight">
        <span className="flex size-7 items-center justify-center rounded-lg bg-lime text-lime-foreground" aria-hidden>
          <Activity className="size-3.5" />
        </span>
        {appName}
      </Link>
      <Link
        href="/ayarlar"
        onClick={onTap("/ayarlar")}
        aria-label="Ayarlar"
        aria-current={active ? "page" : undefined}
        className={cn("flex size-11 items-center justify-center rounded-full", active && "ring-2 ring-lime")}
      >
        <Avatar name={name || "?"} size="sm" />
      </Link>
    </header>
  );
}
