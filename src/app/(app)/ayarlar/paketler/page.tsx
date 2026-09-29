import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { listTemplates } from "@/db/packages";
import { SESSION_TYPE_LABELS, formatTRY } from "@/lib/format";
import { toggleTemplateAction } from "./actions";
import { TemplateForm } from "./template-form";

export const metadata: Metadata = { title: "Paket şablonları" };

export default async function TemplatesPage() {
  const templates = await withTrainer((tx, trainerId) => listTemplates(tx, trainerId));

  return (
    <>
      <Link href="/ayarlar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        Ayarlar
      </Link>
      <PageHeader
        title="Paket şablonları"
        description="Sattığın paketleri bir kez tanımla, danışana satarken tek dokunuşla seç."
      />

      {templates.length > 0 && (
        <ul className="mb-8 divide-y rounded-xl border">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className={t.isActive ? "truncate font-medium" : "truncate font-medium text-muted-foreground line-through"}>
                  {t.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {SESSION_TYPE_LABELS[t.sessionType]} · {t.sessionCount} ders
                  {t.validityDays ? ` · ${t.validityDays} gün` : " · süresiz"}
                  {t.makeupAllowance > 0 && ` · ${t.makeupAllowance} telafi`}
                </p>
              </div>
              {t.price && <span className="text-sm font-medium tabular-nums">{formatTRY(t.price)}</span>}
              {!t.isActive && <Badge variant="secondary">Pasif</Badge>}
              <form action={toggleTemplateAction}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="active" value={String(!t.isActive)} />
                <Button type="submit" variant="ghost" size="sm">
                  {t.isActive ? "Pasifleştir" : "Aktifleştir"}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni şablon</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateForm />
        </CardContent>
      </Card>
    </>
  );
}
