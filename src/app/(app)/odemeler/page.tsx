import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, MessageCircle, Plus, TrendingUp, Wallet } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { StatTile } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
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
          <h2 id="waiting-heading" className="mb-3 text-base font-semibold">
            Onay bekleyen ödemeler
          </h2>
          <ul className="flex flex-col gap-2">
            {waiting.map((p) => (
              <PendingPaymentCard key={p.id} payment={p} />
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Özet" className="mb-8">
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            tone="ink"
            label={`${upperFirst(monthName(trainer.timezone))} tahsilatı`}
            value={formatTRY(summary.thisMonth)}
            hint={`Geçen ay ${formatTRY(summary.lastMonth)}`}
            icon={<TrendingUp />}
          />
          <StatTile
            tone={summary.overdue > 0 ? "lime" : "default"}
            label="Bekleyen alacak"
            value={formatTRY(summary.outstanding)}
            hint={`${summary.overdue > 0 ? `${formatTRY(summary.overdue)} vadesi geldi · ` : ""}${debtors.length} danışan`}
            icon={<Wallet />}
          />
        </div>
        {methods.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {methods.map(([m, total]) => (
              <span key={m} className="rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-card ring-1 ring-border">
                {PAYMENT_METHOD_LABELS[m]} <span className="text-muted-foreground tabular-nums">{formatTRY(total)}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="debtors-heading" className="mb-8">
        <h2 id="debtors-heading" className="mb-3 text-base font-semibold">
          Borçlular
        </h2>
        {debtors.length === 0 ? (
          <EmptyState icon={<CircleCheck />} title="Bekleyen ödeme yok" />
        ) : (
          <ul className="divide-y overflow-hidden surface">
            {debtors.map((d) => (
              <DebtorRow key={d.clientId} debtor={d} portalToken={portals.get(d.clientId)} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-3 text-base font-semibold">
          Son ödemeler
        </h2>
        {recent.length === 0 ? (
          <EmptyState
            icon={<Wallet />}
            title="Henüz ödeme yok"
            action={
              <Button asChild size="sm">
                <Link href="/odemeler/yeni">
                  <Plus />
                  Ödeme al
                </Link>
              </Button>
            }
          >
            Paket satarken ya da buradan girdiğin ödemeler burada görünür. Danışanların havale bildirimleri de onay için buraya gelir.
          </EmptyState>
        ) : (
          <ul className="divide-y overflow-hidden surface">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
                <Avatar name={p.clientName} size="sm" />
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
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={d.fullName} />
        <div className="min-w-0 flex-1">
          <Link href={`/danisanlar/${d.clientId}`} className="block truncate font-medium hover:underline">
            {d.fullName}
          </Link>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {d.overdue > 0 && <span className="font-medium text-destructive-strong">{formatTRY(d.overdue)} vadesi geldi · </span>}
            {d.packages.map((p) => p.name).join(", ")}
          </p>
        </div>
        <span className={d.overdue > 0 ? "font-semibold text-destructive-strong tabular-nums" : "font-semibold tabular-nums"}>
          {formatTRY(d.total)}
        </span>
      </div>
      <div className="flex gap-2 pl-13 sm:pl-0">
        {wa && (
          <Button asChild variant="outline" size="sm">
            <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`${d.fullName} için WhatsApp'ta ödeme hatırlat`}>
              <MessageCircle />
              Hatırlat
            </a>
          </Button>
        )}
        <Button asChild size="sm">
          <Link href={`/odemeler/yeni?danisan=${d.clientId}${pkg}`}>Ödeme al</Link>
        </Button>
      </div>
    </li>
  );
}
