import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, MessageCircle, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/page-header";
import { withTrainer } from "@/db";
import { getPaymentSummary, listDebtors, listPendingPayments, listRecentPayments, type Debtor } from "@/db/payments";
import { getActivePortalTokens } from "@/db/portal";
import { getTrainer } from "@/db/queries";
import { PAYMENT_METHOD_LABELS, formatShortDate, formatTRY } from "@/lib/format";
import { portalUrl } from "@/lib/portal";
import { messages, whatsappLink, withPortal } from "@/lib/whatsapp";
import { DeletePaymentButton } from "./delete-payment-button";
import { PendingPaymentCard } from "./pending-payment";

export const metadata: Metadata = { title: "Ödemeler" };

const monthName = (timeZone: string) => new Intl.DateTimeFormat("tr-TR", { month: "long", timeZone }).format(new Date());
// CSS `capitalize` would also capitalize "tahsilatı"; only the month should be.
const upperFirst = (s: string) => s.charAt(0).toLocaleUpperCase("tr") + s.slice(1);

export default async function PaymentsPage() {
  const { trainer, summary, debtors, recent, portals, waiting } = await withTrainer(async (tx, trainerId) => {
    const trainer = await getTrainer(tx, trainerId);
    const summary = await getPaymentSummary(tx, trainer);
    const debtors = await listDebtors(tx, trainerId);
    const recent = await listRecentPayments(tx, trainerId);
    const waiting = await listPendingPayments(tx, trainerId);
    const portals = await getActivePortalTokens(tx, debtors.map((d) => d.clientId));
    return { trainer, summary, debtors, recent, portals, waiting };
  });

  const methods = Object.entries(summary.byMethod).filter(([, total]) => total > 0) as [
    keyof typeof PAYMENT_METHOD_LABELS,
    number,
  ][];

  return (
    <>
      <PageHeader
        title="Ödemeler"
        action={
          <Button asChild>
            <Link href="/odemeler/yeni">
              <Plus />
              <span className="max-sm:sr-only">Ödeme al</span>
            </Link>
          </Button>
        }
      />

      {waiting.length > 0 && (
        <section aria-labelledby="waiting-heading" className="mb-8">
          <h2 id="waiting-heading" className="mb-3 text-sm font-medium text-muted-foreground">
            Onay bekleyen ödemeler
          </h2>
          <ul className="flex flex-col gap-2">
            {waiting.map((p) => (
              <PendingPaymentCard key={p.id} payment={p} />
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Özet" className="mb-8 grid grid-cols-2 gap-3">
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">{upperFirst(monthName(trainer.timezone))} tahsilatı</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{formatTRY(summary.thisMonth)}</p>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">Geçen ay {formatTRY(summary.lastMonth)}</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Bekleyen alacak</p>
            <p
              className={
                summary.outstanding > 0
                  ? "mt-1 text-2xl font-semibold text-destructive tabular-nums"
                  : "mt-1 text-2xl font-semibold tabular-nums"
              }
            >
              {formatTRY(summary.outstanding)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.overdue > 0 ? `${formatTRY(summary.overdue)} vadesi gelmiş · ` : ""}
              {debtors.length} danışan
            </p>
          </CardContent>
        </Card>
        {methods.length > 0 && (
          <p className="col-span-2 text-xs text-muted-foreground">
            Bu ay: {methods.map(([m, total]) => `${PAYMENT_METHOD_LABELS[m]} ${formatTRY(total)}`).join(" · ")}
          </p>
        )}
      </section>

      <section aria-labelledby="debtors-heading" className="mb-8">
        <h2 id="debtors-heading" className="mb-3 text-sm font-medium text-muted-foreground">
          Borçlular
        </h2>
        {debtors.length === 0 ? (
          <EmptyState icon={<CircleCheck />} title="Bekleyen ödeme yok" />
        ) : (
          <ul className="divide-y rounded-xl border">
            {debtors.map((d) => (
              <DebtorRow key={d.clientId} debtor={d} portalToken={portals.get(d.clientId)} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-3 text-sm font-medium text-muted-foreground">
          Son ödemeler
        </h2>
        {recent.length === 0 ? (
          <EmptyState icon={<Wallet />} title="Henüz ödeme yok">
            Paket satarken ya da buradan aldığın ödemeler burada listelenir.
          </EmptyState>
        ) : (
          <ul className="divide-y rounded-xl border">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2 pr-2 pl-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/danisanlar/${p.clientId}`} className="block truncate text-sm font-medium hover:underline">
                    {p.clientName}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatShortDate(p.paidOn)} · {PAYMENT_METHOD_LABELS[p.method]}
                    {p.packageName && ` · ${p.packageName}`}
                    {p.note && ` · ${p.note}`}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums">{formatTRY(p.amount)}</span>
                <DeletePaymentButton id={p.id} label={`${p.clientName} · ${formatTRY(p.amount)}`} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function DebtorRow({ debtor: d, portalToken }: { debtor: Debtor; portalToken?: string }) {
  const wa = whatsappLink(
    d.phone,
    withPortal(messages.paymentDue(d.fullName, formatTRY(d.overdue > 0 ? d.overdue : d.total)), portalToken && portalUrl(portalToken)),
  );
  // One package: pay straight into it. Several: let the form pick the oldest.
  const pkg = d.packages.length === 1 ? `&paket=${d.packages[0].id}` : "";

  return (
    <li className="flex items-center gap-2 py-3 pr-2 pl-4">
      <div className="min-w-0 flex-1">
        <Link href={`/danisanlar/${d.clientId}`} className="block truncate font-medium hover:underline">
          {d.fullName}
        </Link>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {d.overdue > 0 && <span className="font-medium text-destructive">{formatTRY(d.overdue)} vadesi gelmiş · </span>}
          {d.packages.map((p) => p.name).join(", ")}
        </p>
      </div>
      <span className={d.overdue > 0 ? "font-medium text-destructive tabular-nums" : "font-medium tabular-nums"}>{formatTRY(d.total)}</span>
      {wa && (
        <Button asChild variant="ghost" size="icon" aria-label={`${d.fullName} için WhatsApp'ta ödeme hatırlat`}>
          <a href={wa} target="_blank" rel="noopener noreferrer">
            <MessageCircle />
          </a>
        </Button>
      )}
      <Button asChild variant="outline" size="sm">
        <Link href={`/odemeler/yeni?danisan=${d.clientId}${pkg}`}>Ödeme al</Link>
      </Button>
    </li>
  );
}
