"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Activity, Bell, BookOpen, ChevronLeft, ChevronRight, Copy, EllipsisVertical, MoreHorizontal, Share, Smartphone, SquarePlus, X } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { PushToggle } from "@/components/push-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// "Add to home screen, then turn on notifications", explained for the device
// in hand. iPhone needs both steps (web push only works from the home-screen
// app); Android and desktop can take notifications straight from the browser.

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };
type Result = { ok: true } | { ok: false; error: string };
type Push = { subscribe: (sub: Sub) => Promise<Result>; unsubscribe: (endpoint: string) => Promise<Result>; description: string };

type Kind = "ios" | "ios-inapp" | "android" | "desktop";
type BeforeInstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

function detect(): { kind: Kind; standalone: boolean; chromeIos: boolean } {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  // Instagram, Facebook, TikTok… open links in their own browser, which can't add to the home screen.
  const inApp = /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|Snapchat|LinkedInApp/i.test(ua);
  const kind: Kind = ios ? (inApp ? "ios-inapp" : "ios") : /android/i.test(ua) ? "android" : "desktop";
  return { kind, standalone, chromeIos: ios && /CriOS/i.test(ua) };
}

function useDevice() {
  const [device, setDevice] = useState<ReturnType<typeof detect> | null>(null);
  const [prompt, setPrompt] = useState<BeforeInstallPrompt | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // Read after mount: the server can't know the device, and this keeps hydration stable.
    queueMicrotask(() => setDevice(detect()));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  return { device, prompt, clearPrompt: () => setPrompt(null) };
}

/** A small picture of the control to look for, so the trainer knows it on sight. */
function Tile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-muted px-4 text-sm font-medium", className)} aria-hidden>
      {children}
    </div>
  );
}

const Hot = ({ children }: { children: ReactNode }) => (
  <span className="flex size-9 items-center justify-center rounded-full bg-lime text-lime-foreground ring-4 ring-lime/30 [&_svg]:size-[18px]">
    {children}
  </span>
);
const Dim = ({ children }: { children: ReactNode }) => <span className="text-muted-foreground/60 [&_svg]:size-[18px]">{children}</span>;

function AppIcon({ name }: { name: string }) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="flex size-10 items-center justify-center rounded-[0.8rem] bg-lime text-lime-foreground shadow-card">
        <Activity className="size-5" />
      </span>
      <span className="text-[10px] leading-none">{name}</span>
    </span>
  );
}

function Steps({ steps }: { steps: { title: string; text: ReactNode; tile?: ReactNode }[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums">
            {i + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-sm">
              <span className="font-semibold">{s.title}</span>
              <span className="block text-muted-foreground">{s.text}</span>
            </p>
            {s.tile}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * The full walkthrough for this device. `appName` is what appears under the
 * home-screen icon; `notifyWhere` says where to turn notifications on once
 * the app is open (used on iPhone before it's installed).
 */
export function InstallSteps({ appName, url, push, notifyWhere }: { appName: string; url: string; push: Push; notifyWhere: string }) {
  const { device, prompt, clearPrompt } = useDevice();
  if (!device) return null;
  const { kind, standalone, chromeIos } = device;

  // Already the home-screen app (or a browser that can take push directly): only notifications are left.
  if (standalone) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Uygulama ana ekranında. Son adım: bildirimleri aç.</p>
        <PushToggle {...push} />
      </div>
    );
  }

  if (kind === "ios-inapp") {
    return (
      <Steps
        steps={[
          {
            title: "Safari'de aç",
            text: "Instagram gibi uygulamaların içindeki tarayıcıdan ana ekrana eklenemiyor. Sağ üstteki ••• menüsüne dokun, “Tarayıcıda aç”ı seç.",
            tile: (
              <Tile>
                <Dim>
                  <X />
                </Dim>
                <span className="flex-1 truncate text-xs text-muted-foreground">{url.replace(/^https?:\/\//, "")}</span>
                <Hot>
                  <MoreHorizontal />
                </Hot>
              </Tile>
            ),
          },
          {
            title: "Ya da linki kopyala",
            text: "Safari'yi açıp adres çubuğuna yapıştır.",
            tile: <CopyButton text={url} variant="outline" size="sm" className="self-start" />,
          },
        ]}
      />
    );
  }

  if (kind === "ios") {
    return (
      <Steps
        steps={[
          {
            title: "Paylaş simgesine dokun",
            text: chromeIos ? "Chrome'da adres çubuğunun sağındaki paylaş simgesi." : "Safari'de ekranın altındaki (iPad'de üstteki) kare ve ok simgesi.",
            tile: (
              // Safari's bottom bar: back, forward, share, bookmarks, tabs.
              <Tile className="justify-around">
                <Dim>
                  <ChevronLeft />
                </Dim>
                <Dim>
                  <ChevronRight />
                </Dim>
                <Hot>
                  <Share />
                </Hot>
                <Dim>
                  <BookOpen />
                </Dim>
                <Dim>
                  <Copy />
                </Dim>
              </Tile>
            ),
          },
          {
            title: "“Ana Ekrana Ekle”yi seç",
            text: "Listede görmüyorsan biraz aşağı kaydır. Sonra sağ üstten “Ekle”ye dokun.",
            tile: (
              <Tile className="justify-between">
                <span>Ana Ekrana Ekle</span>
                <Hot>
                  <SquarePlus />
                </Hot>
              </Tile>
            ),
          },
          {
            title: `Ana ekrandaki ${appName} simgesinden aç`,
            text: "Artık uygulama gibi tam ekran açılır; her seferinde link aramana gerek kalmaz.",
            tile: (
              <Tile className="h-20 justify-center">
                <AppIcon name={appName} />
              </Tile>
            ),
          },
          {
            title: "Bildirimleri aç",
            text: `Uygulamayı ana ekrandan açtıktan sonra ${notifyWhere} “Aç”a dokun ve izin ver. iPhone bildirimleri yalnızca ana ekrandan açılan uygulamaya gönderir.`,
            tile: (
              <Tile className="justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="size-4" />
                  Bildirimleri aç
                </span>
                <span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">Aç</span>
              </Tile>
            ),
          },
        ]}
      />
    );
  }

  if (kind === "android") {
    return (
      <div className="flex flex-col gap-4">
        {prompt ? (
          <Button
            type="button"
            size="lg"
            onClick={async () => {
              await prompt.prompt();
              await prompt.userChoice;
              clearPrompt();
            }}
          >
            <SquarePlus />
            {appName}&apos;u telefonuna yükle
          </Button>
        ) : (
          <Steps
            steps={[
              {
                title: "Menüye dokun",
                text: "Chrome'da sağ üstteki üç nokta.",
                tile: (
                  <Tile className="justify-between">
                    <span className="truncate text-xs text-muted-foreground">{url.replace(/^https?:\/\//, "")}</span>
                    <Hot>
                      <EllipsisVertical />
                    </Hot>
                  </Tile>
                ),
              },
              {
                title: "“Ana ekrana ekle” ya da “Uygulamayı yükle”",
                text: `Onayla; ${appName} simgesi ana ekranına gelir.`,
                tile: (
                  <Tile className="h-20">
                    <AppIcon name={appName} />
                  </Tile>
                ),
              },
            ]}
          />
        )}
        <PushToggle {...push} />
      </div>
    );
  }

  // Desktop: notifications work in the browser; the phone is where the app belongs.
  return (
    <div className="flex flex-col gap-4">
      <PushToggle {...push} />
      <div className="flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm">
        <Smartphone className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p>
            <span className="font-semibold">Telefonunda da kullan.</span>{" "}
            <span className="text-muted-foreground">Bu linki telefonunda aç, ana ekrana ekle ve bildirimleri orada da aç.</span>
          </p>
          <CopyButton text={url} variant="outline" size="sm" className="self-start" />
        </div>
      </div>
    </div>
  );
}

/**
 * A dismissible card that invites the reader to install the app. It hides
 * itself once the app runs from the home screen with notifications allowed,
 * or when closed on this device.
 */
export function InstallCard({
  storageKey,
  title,
  description,
  ...steps
}: { storageKey: string; title: string; description: string } & Parameters<typeof InstallSteps>[0]) {
  const [state, setState] = useState<"hidden" | "closed" | "open">("hidden");

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(storageKey) === "1";
    } catch {
      // Private mode or blocked storage: just show the card.
    }
    const d = detect();
    const done = d.standalone && "Notification" in window && Notification.permission === "granted";
    queueMicrotask(() => setState(dismissed || done ? "hidden" : "closed"));
  }, [storageKey]);

  if (state === "hidden") return null;

  function dismiss() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // Nothing to remember it in; it hides for this visit.
    }
    setState("hidden");
  }

  return (
    <section aria-labelledby={`${storageKey}-title`} className="relative overflow-hidden surface">
      <div className="flex items-start gap-4 p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[0.9rem] bg-lime text-lime-foreground shadow-card" aria-hidden>
          <Activity className="size-6" />
        </span>
        <div className="min-w-0 flex-1 pr-8">
          <h2 id={`${storageKey}-title`} className="text-base font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          {state === "closed" && (
            <Button type="button" size="sm" className="mt-3" onClick={() => setState("open")}>
              Nasıl yapılır?
            </Button>
          )}
        </div>
        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" aria-label="Kapat" onClick={dismiss}>
          <X />
        </Button>
      </div>
      {state === "open" && (
        <div className="border-t p-5">
          <InstallSteps {...steps} />
        </div>
      )}
    </section>
  );
}
