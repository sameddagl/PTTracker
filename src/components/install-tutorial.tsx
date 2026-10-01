"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  EllipsisVertical,
  Home,
  Plus,
  RotateCw,
  Share,
  SquarePlus,
  Star,
  X,
} from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// "Ana ekrana ekle" as a short slideshow: one step per slide, each with a
// drawing of the phone screen and the control to tap marked in lime.

type Platform = "ios" | "android";
type Slide = { title: string; text: ReactNode; screen: ReactNode };

/** The control to tap. */
const Hot = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn("relative flex size-9 items-center justify-center rounded-full bg-lime text-lime-foreground [&_svg]:size-[18px]", className)}>
    <span className="absolute inset-0 animate-ping rounded-full bg-lime/50 motion-reduce:hidden" aria-hidden />
    <span className="relative">{children}</span>
  </span>
);
const Dim = ({ children }: { children: ReactNode }) => <span className="flex size-9 items-center justify-center text-muted-foreground/60 [&_svg]:size-[18px]">{children}</span>;

function AppIcon({ name, big }: { name: string; big?: boolean }) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span className={cn("flex items-center justify-center rounded-[0.8rem] bg-lime text-lime-foreground shadow-card", big ? "size-14" : "size-10")}>
        <Activity className={big ? "size-7" : "size-5"} />
      </span>
      <span className="text-[10px] leading-none">{name}</span>
    </span>
  );
}

/** A phone outline with the slide's screen inside. */
function Phone({ children, top }: { children: ReactNode; top?: ReactNode }) {
  return (
    <div className="mx-auto flex h-72 w-44 flex-col overflow-hidden rounded-[2rem] border-[6px] border-foreground/85 bg-canvas text-foreground shadow-float" aria-hidden>
      <div className="flex h-5 shrink-0 items-center justify-center">
        <span className="h-2.5 w-14 rounded-full bg-foreground/85" />
      </div>
      {top}
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Grey bars standing in for page content. */
const Page = () => (
  <div className="flex flex-1 flex-col gap-2 p-3">
    <span className="h-3 w-2/3 rounded bg-muted" />
    <span className="h-14 rounded-xl bg-card shadow-card" />
    <span className="h-14 rounded-xl bg-card shadow-card" />
    <span className="h-8 rounded-xl bg-card shadow-card" />
  </div>
);

const Sheet = ({ children }: { children: ReactNode }) => (
  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 rounded-t-2xl bg-card p-2 text-[11px] shadow-float">{children}</div>
);
const SheetRow = ({ children, hot }: { children: ReactNode; hot?: boolean }) => (
  <div className={cn("flex h-8 items-center justify-between rounded-lg px-2", hot ? "bg-lime/20 font-semibold ring-2 ring-lime" : "text-muted-foreground")}>{children}</div>
);

function iosSlides(appName: string, notifyWhere: string): Slide[] {
  return [
    {
      title: "Safari'de paylaş simgesine dokun",
      text: "Ekranın altındaki, içinden ok çıkan kare. Chrome kullanıyorsan adres çubuğunun sağında.",
      screen: (
        <Phone>
          <Page />
          <div className="flex h-11 items-center justify-around border-t bg-card">
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
          </div>
        </Phone>
      ),
    },
    {
      title: "“Ana Ekrana Ekle”yi seç",
      text: "Listede görmüyorsan biraz aşağı kaydır.",
      screen: (
        <Phone>
          <Page />
          <Sheet>
            <SheetRow>
              Kopyala <Copy className="size-3.5" />
            </SheetRow>
            <SheetRow>
              Yer İşareti Ekle <BookOpen className="size-3.5" />
            </SheetRow>
            <SheetRow hot>
              Ana Ekrana Ekle <SquarePlus className="size-3.5" />
            </SheetRow>
            <SheetRow>
              Favorilere Ekle <Star className="size-3.5" />
            </SheetRow>
          </Sheet>
        </Phone>
      ),
    },
    {
      title: "Sağ üstten “Ekle”ye dokun",
      text: `Simgenin adı “${appName}” olarak gelir, istersen değiştirebilirsin.`,
      screen: (
        <Phone>
          <div className="flex items-center justify-between px-3 py-2 text-[11px]">
            <span className="text-muted-foreground">Vazgeç</span>
            <span className="font-semibold">Ana Ekrana Ekle</span>
            <span className="rounded-full bg-lime px-2 py-1 font-semibold text-lime-foreground ring-4 ring-lime/30">Ekle</span>
          </div>
          <div className="mx-3 flex items-center gap-3 rounded-xl bg-card p-3 shadow-card">
            <AppIcon name="" />
            <span className="text-xs font-medium">{appName}</span>
          </div>
        </Phone>
      ),
    },
    {
      title: `Ana ekrandaki ${appName} simgesinden aç`,
      text: "Artık tarayıcı çubukları olmadan, tam ekran açılır. Linki her seferinde aramazsın.",
      screen: (
        <Phone>
          <div className="grid grid-cols-3 gap-3 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="mx-auto size-10 rounded-[0.8rem] bg-muted" />
            ))}
            <span className="relative mx-auto">
              <span className="absolute -inset-1.5 animate-pulse rounded-[1rem] ring-2 ring-lime motion-reduce:animate-none" />
              <AppIcon name={appName} />
            </span>
          </div>
        </Phone>
      ),
    },
    {
      title: "Bildirimleri aç",
      text: `Simgeden açınca ${notifyWhere} “Aç”a dokun, gelen soruda “İzin Ver” de. iPhone'da bildirim yalnızca ana ekrandaki simgeden açınca geliyor.`,
      screen: (
        <Phone>
          <Page />
          <div className="absolute inset-x-3 top-16 flex flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center text-[11px] shadow-float">
            <Bell className="size-5" />
            <span className="font-semibold">“{appName}” bildirim göndermek istiyor</span>
            <span className="flex w-full gap-1">
              <span className="flex-1 rounded-lg py-1.5 text-muted-foreground">İzin Verme</span>
              <span className="flex-1 rounded-lg bg-lime py-1.5 font-semibold text-lime-foreground ring-4 ring-lime/30">İzin Ver</span>
            </span>
          </div>
        </Phone>
      ),
    },
  ];
}

function androidSlides(appName: string, notifyWhere: string): Slide[] {
  const bar = (
    <div className="flex h-10 items-center gap-2 border-b bg-card px-2">
      <Dim>
        <Home />
      </Dim>
      <span className="h-6 flex-1 rounded-full bg-muted" />
      <Hot>
        <EllipsisVertical />
      </Hot>
    </div>
  );
  return [
    {
      title: "Chrome'da sağ üstteki üç noktaya dokun",
      text: "Adres çubuğunun sağında.",
      screen: (
        <Phone top={bar}>
          <Page />
        </Phone>
      ),
    },
    {
      title: "“Ana ekrana ekle” ya da “Uygulamayı yükle”",
      text: "Telefonuna göre ikisinden biri yazar.",
      screen: (
        <Phone
          top={
            <div className="flex h-10 items-center gap-2 border-b bg-card px-2">
              <span className="h-6 flex-1 rounded-full bg-muted" />
            </div>
          }
        >
          <Page />
          <div className="absolute top-1 right-1 flex w-32 flex-col gap-0.5 rounded-xl bg-card p-1.5 text-[11px] shadow-float">
            <SheetRow>
              Yeni sekme <Plus className="size-3.5" />
            </SheetRow>
            <SheetRow>
              Yenile <RotateCw className="size-3.5" />
            </SheetRow>
            <SheetRow hot>
              Ana ekrana ekle <SquarePlus className="size-3.5" />
            </SheetRow>
          </div>
        </Phone>
      ),
    },
    {
      title: "“Ekle” ya da “Yükle”ye dokun",
      text: `${appName} simgesi ana ekranına gelir.`,
      screen: (
        <Phone>
          <Page />
          <div className="absolute inset-x-3 top-16 flex flex-col gap-3 rounded-2xl bg-card p-3 text-[11px] shadow-float">
            <span className="font-semibold">Ana ekrana ekle</span>
            <span className="flex items-center gap-2">
              <AppIcon name="" />
              {appName}
            </span>
            <span className="flex justify-end gap-2">
              <span className="px-2 py-1 text-muted-foreground">İptal</span>
              <span className="rounded-full bg-lime px-3 py-1 font-semibold text-lime-foreground ring-4 ring-lime/30">Ekle</span>
            </span>
          </div>
        </Phone>
      ),
    },
    {
      title: "Bildirimleri aç",
      text: `${notifyWhere.charAt(0).toLocaleUpperCase("tr")}${notifyWhere.slice(1)} “Aç”a dokun, gelen soruda “İzin ver” de.`,
      screen: (
        <Phone>
          <Page />
          <div className="absolute inset-x-3 top-16 flex flex-col gap-2 rounded-2xl bg-card p-3 text-[11px] shadow-float">
            <Bell className="size-5" />
            <span className="font-semibold">{appName} bildirim göndermek istiyor</span>
            <span className="flex justify-end gap-2">
              <span className="px-2 py-1 text-muted-foreground">İzin verme</span>
              <span className="rounded-full bg-lime px-3 py-1 font-semibold text-lime-foreground ring-4 ring-lime/30">İzin ver</span>
            </span>
          </div>
        </Phone>
      ),
    },
  ];
}

const isAndroid = () => /android/i.test(navigator.userAgent);
const isPhone = () => /iphone|ipad|ipod|android/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** "Nasıl yapılır?" as a dialog. On a computer it starts by sending the link to the phone. */
export function InstallTutorial({
  open,
  onClose,
  appName,
  url,
  notifyWhere,
}: {
  open: boolean;
  onClose: () => void;
  appName: string;
  url: string;
  notifyWhere: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [platform, setPlatform] = useState<Platform>("ios");
  const [step, setStep] = useState(0);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      queueMicrotask(() => {
        setPlatform(isAndroid() ? "android" : "ios");
        setDesktop(!isPhone());
        setStep(0);
      });
      d.showModal();
    }
    if (!open && d.open) d.close();
  }, [open]);

  const slides = platform === "ios" ? iosSlides(appName, notifyWhere) : androidSlides(appName, notifyWhere);
  const slide = slides[Math.min(step, slides.length - 1)];
  const last = step >= slides.length - 1;

  return (
    <dialog
      ref={ref}
      aria-labelledby="install-tutorial-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border bg-card p-0 text-foreground shadow-float backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="install-tutorial-title" className="text-lg font-semibold">
            Ana ekrana ekle
          </h2>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Kapat" onClick={onClose}>
            <X />
          </Button>
        </div>

        {desktop && (
          <div className="flex flex-col gap-2 rounded-2xl bg-muted p-3 text-sm">
            <p>
              <span className="font-semibold">Önce linki telefonunda aç.</span>{" "}
              <span className="text-muted-foreground">Kendine mesajla gönder ya da kopyalayıp telefonunda yapıştır, sonra bu adımları izle.</span>
            </p>
            <CopyButton text={url} variant="outline" size="sm" className="self-start" />
            <p className="truncate text-xs text-muted-foreground select-all">{url}</p>
          </div>
        )}

        <div role="tablist" aria-label="Telefon" className="flex gap-1 self-start rounded-full bg-muted p-1">
          {(
            [
              ["ios", "iPhone"],
              ["android", "Android"],
            ] as const
          ).map(([p, label]) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={platform === p}
              onClick={() => {
                setPlatform(p);
                setStep(0);
              }}
              className={cn(
                "min-h-9 rounded-full px-4 text-sm font-medium transition-colors",
                platform === p ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div key={`${platform}-${step}`} className="anim-rise flex flex-col gap-4">
          {slide.screen}
          <div className="min-h-24 text-center">
            <p className="text-xs font-medium text-muted-foreground tabular-nums">
              Adım {step + 1} / {slides.length}
            </p>
            <h3 className="mt-1 text-base font-semibold" aria-live="polite">
              {slide.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{slide.text}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft />
            Geri
          </Button>
          <span className="flex gap-1.5" aria-hidden>
            {slides.map((_, i) => (
              <span key={i} className={cn("size-2 rounded-full transition-colors", i === step ? "bg-foreground" : "bg-muted")} />
            ))}
          </span>
          {last ? (
            <Button type="button" onClick={onClose}>
              Tamam
            </Button>
          ) : (
            <Button type="button" onClick={() => setStep((s) => s + 1)}>
              İleri
              <ChevronRight />
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}
