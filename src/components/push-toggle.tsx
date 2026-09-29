"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Share } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };
type Result = { ok: true } | { ok: false; error: string };

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type Support = "loading" | "ok" | "ios-install" | "unsupported";

/**
 * "Bildirimleri aç": registers the service worker, asks permission and hands
 * the subscription to the server. On iPhone, web push only works from an app
 * added to the home screen, so it explains that step instead.
 */
export function PushToggle({
  subscribe,
  unsubscribe,
  description,
}: {
  subscribe: (sub: Sub) => Promise<Result>;
  unsubscribe: (endpoint: string) => Promise<Result>;
  description: string;
}) {
  const [support, setSupport] = useState<Support>("loading");
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const check = async (): Promise<[Support, string | null]> => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone);
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return [ios && !standalone ? "ios-install" : "unsupported", null];
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const sub = await reg.pushManager.getSubscription();
      return ["ok", sub?.endpoint ?? null];
    };
    check()
      .then(([s, e]) => {
        setEndpoint(e);
        setSupport(s);
      })
      .catch(() => setSupport("unsupported"));
  }, []);

  function enable() {
    start(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return void toast.error("Bildirim izni verilmedi. Tarayıcı ayarlarından açabilirsin.");
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        });
        const json = sub.toJSON() as Sub;
        const res = await subscribe({ endpoint: json.endpoint, keys: json.keys });
        if (!res.ok) return void toast.error(res.error);
        setEndpoint(json.endpoint);
        toast.success("Bildirimler açıldı");
      } catch {
        toast.error("Bildirimler açılamadı. Tekrar dene.");
      }
    });
  }

  function disable() {
    start(async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribe(sub.endpoint);
        await sub.unsubscribe();
      }
      setEndpoint(null);
      toast("Bu cihazda bildirimler kapatıldı");
    });
  }

  if (support === "loading" || support === "unsupported") return null;

  return (
    <div className="flex items-center gap-3 surface p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted [&_svg]:size-[18px]">
        {endpoint ? <Bell aria-hidden /> : <BellOff aria-hidden />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{endpoint ? "Bildirimler bu cihazda açık" : "Bildirimleri aç"}</p>
        <p className="text-xs text-muted-foreground">
          {support === "ios-install" ? (
            <>
              iPhone&apos;da bildirim için önce bu sayfayı ana ekrana ekle: <Share className="inline size-3.5 align-[-2px]" aria-label="Paylaş" />{" "}
              → Ana Ekrana Ekle, sonra oradan aç.
            </>
          ) : (
            description
          )}
        </p>
      </div>
      {support === "ok" &&
        (endpoint ? (
          <Button type="button" size="sm" variant="ghost" loading={pending} onClick={disable}>
            Kapat
          </Button>
        ) : (
          <Button type="button" size="sm" loading={pending} onClick={enable}>
            Aç
          </Button>
        ))}
    </div>
  );
}
