"use client";

import { useState, useTransition } from "react";
import { Copy, ExternalLink, Link2, Link2Off, RefreshCw } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { renderTemplate, type MessageTemplates } from "@/lib/templates";
import { whatsappLink } from "@/lib/whatsapp";
import { createPortalLinkAction, revokePortalLinkAction } from "./portal-actions";

export function PortalCard({
  clientId,
  clientName,
  phone,
  templates,
  url: initialUrl,
  lastOpened,
}: {
  clientId: string;
  clientName: string;
  phone: string | null;
  templates: MessageTemplates;
  url: string | null;
  /** Already formatted on the server ("29 Eyl 14:05"), or null if never opened. */
  lastOpened: string | null;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [pending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();
  // Which button started the running action, so only that one spins.
  const [busy, setBusy] = useState<"create" | "renew" | "revoke" | null>(null);

  async function create(kind: "create" | "renew") {
    if (
      kind === "renew" &&
      !(await confirm({ title: "Yeni link oluşturulsun mu?", body: "Danışanın elindeki eski link çalışmaz.", confirmLabel: "Yeni link oluştur" }))
    )
      return;
    setBusy(kind);
    startTransition(async () => {
      const res = await createPortalLinkAction(clientId);
      if ("error" in res) return void toast.error(res.error);
      setUrl(res.url);
      toast.success(kind === "renew" ? "Yeni link oluşturuldu" : "Link hazır");
    });
  }

  async function revoke() {
    if (!(await confirm({ title: "Link kapatılsın mı?", body: "Danışan bu linkle sayfasını açamaz.", confirmLabel: "Linki kapat", destructive: true })))
      return;
    setBusy("revoke");
    startTransition(async () => {
      const res = await revokePortalLinkAction(clientId);
      if (!res.ok) return void toast.error("Link kapatılamadı");
      setUrl(null);
      toast.success("Link kapatıldı");
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link kopyalandı");
    } catch {
      toast.error("Kopyalanamadı. Linki basılı tutup kopyala.");
    }
  }

  const wa = url ? whatsappLink(phone, renderTemplate(templates, "portalInvite", { ad: clientName, link: url })) : null;

  return (
    <>
      {dialog}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4 text-muted-foreground" aria-hidden />
            Danışan sayfası
          </CardTitle>
          <CardDescription>
            Danışan bu linkten kalan derslerini, randevularını ve ödemelerini görür. Uygulama indirmesi ya da giriş yapması
            gerekmez.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {url ? (
            <>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 py-1 pr-1 pl-3">
                <span className="min-w-0 flex-1 truncate font-mono text-xs select-all">{url}</span>
                <Button type="button" size="sm" variant="ghost" onClick={copy} aria-label="Linki kopyala">
                  <Copy />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {wa && (
                  <Button asChild size="sm">
                    <a href={wa} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon />
                      WhatsApp&apos;ta gönder
                    </a>
                  </Button>
                )}
                <Button asChild size="sm" variant="outline">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    Önizle
                  </a>
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{lastOpened ? `Son açılış: ${lastOpened}` : "Danışan henüz açmadı"}</span>
                <span className="flex gap-1">
                  <Button type="button" size="sm" variant="ghost" disabled={pending} loading={pending && busy === "renew"} onClick={() => create("renew")}>
                    <RefreshCw />
                    Yenile
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={pending} loading={pending && busy === "revoke"} onClick={revoke}>
                    <Link2Off />
                    Kapat
                  </Button>
                </span>
              </div>
            </>
          ) : (
            <Button type="button" variant="outline" loading={pending} onClick={() => create("create")} className="self-start">
              <Link2 />
              {pending ? "Oluşturuluyor…" : "Link oluştur"}
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
