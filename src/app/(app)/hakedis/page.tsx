import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { withTrainer } from "@/db";
import { payrollFor } from "@/db/payroll";
import { getTrainer } from "@/db/queries";
import { isStudio } from "@/db/team";
import { formatShortDate, formatTRY, formatTime, todayISO } from "@/lib/format";
import { MONTH_PATTERN, SESSION_LABELS, payRuleLabel, type SessionType } from "@/lib/payroll";
import { teamColor } from "@/lib/team";
import { PayrollButtons } from "./payroll-actions";

export const metadata: Metadata = { title: "Hakediş" };

const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));

function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const TYPES: SessionType[] = ["private", "duet", "trio", "group"];

export default async function PayrollPage({ searchParams }: PageProps<"/hakedis">) {
  const { ay } = await searchParams;
  const data = await withTrainer(async (tx, trainerId, member) => {
    if (!(await isStudio(tx, trainerId))) return null;
    const trainer = await getTrainer(tx, trainerId);
    const current = todayISO(trainer.timezone).slice(0, 7);
    const month = typeof ay === "string" && MONTH_PATTERN.test(ay) && ay <= current ? ay : current;
    const rows = await payrollFor(tx, trainerId, month, {
      tz: trainer.timezone,
      countsMissed: trainer.payrollCountsMissed,
      // An instructor sees only their own pay.
      memberId: member.role === "owner" ? undefined : member.id,
    });
    return { rows, month, current, owner: member.role === "owner", tz: trainer.timezone, countsMissed: trainer.payrollCountsMissed };
  });
  if (!data) notFound();
  const { rows, month, current, owner, tz, countsMissed } = data;
  const total = rows.reduce((s, r) => s + r.summary.amount, 0);

  return (
    <>
      <PageHeader
        title={owner ? "Hakediş" : "Hakedişim"}
        description={
          owner
            ? `Eğitmenlerin bu ayda verdiği dersler ve ücret kurallarına göre tutarları. ${countsMissed ? "Geç iptal ve gelmeyenler de sayılıyor." : "Sadece danışanın geldiği dersler sayılıyor."}`
            : "Bu ayda verdiğin dersler ve stüdyonun ücret kuralına göre tutar."
        }
        action={
          owner && rows.length > 0 ? (
            <Button asChild variant="outline" size="sm">
              <a href={`/hakedis/indir?ay=${month}`} download>
                <Download />
                Excel
              </a>
            </Button>
          ) : undefined
        }
      />

      <nav aria-label="Ay" className="mb-6 flex items-center gap-2">
        <Button asChild variant="outline" size="icon" aria-label="Önceki ay">
          <Link href={`/hakedis?ay=${shiftMonth(month, -1)}`}>
            <ChevronLeft />
          </Link>
        </Button>
        <span className="min-w-0 flex-1 text-center text-sm font-medium capitalize">{monthLabel(month)}</span>
        {month < current ? (
          <Button asChild variant="outline" size="icon" aria-label="Sonraki ay">
            <Link href={`/hakedis?ay=${shiftMonth(month, 1)}`}>
              <ChevronRight />
            </Link>
          </Button>
        ) : (
          <span className="size-11 md:size-9" aria-hidden />
        )}
      </nav>

      {rows.length === 0 ? (
        <EmptyState icon={<Avatar name="?" />} title="Bu ay hakediş yok">
          {owner ? "Eğitmenlerin bu ay verdiği ders olunca burada görünür." : "Bu ay verdiğin ders olunca burada görünür."}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {owner && rows.length > 1 && (
            <p className="surface px-5 py-4 text-sm">
              Toplam <strong className="text-lg font-semibold tabular-nums">{formatTRY(total)}</strong> · {rows.reduce((s, r) => s + r.summary.lessons, 0)} ders
            </p>
          )}
          {rows.map((r, i) => (
            <section key={r.member.id} aria-label={r.member.fullName} className="surface p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span className="relative shrink-0">
                  <Avatar name={r.member.fullName || "?"} />
                  <span className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full ring-2 ring-card" style={{ background: teamColor(r.member.color, i + 1) }} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.member.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.closed ? `${formatShortDate(r.closed.closedAt.toISOString().slice(0, 10))} tarihinde kapatıldı` : payRuleLabel(r.member.payRule, formatTRY)}
                  </p>
                </div>
                <p className="text-right">
                  <span className="block text-2xl font-semibold tracking-tight tabular-nums">{formatTRY(r.summary.amount)}</span>
                  <span className="text-xs text-muted-foreground">{r.summary.lessons} ders</span>
                </p>
              </div>
              <dl className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
                {TYPES.map((t) => (
                  <div key={t} className="rounded-xl bg-muted/60 px-2 py-2">
                    <dt className="text-xs text-muted-foreground">{SESSION_LABELS[t]}</dt>
                    <dd className="font-semibold tabular-nums">{r.summary.byType[t]}</dd>
                  </div>
                ))}
              </dl>
              {r.summary.lines.length > 0 && (
                <details className="mt-4 group">
                  <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-muted-foreground hover:text-foreground">Dersler</summary>
                  <ul className="mt-2 divide-y text-sm">
                    {r.summary.lines.map((l) => (
                      <li key={l.lessonId} className="flex items-center gap-3 py-2">
                        <span className="w-20 shrink-0 tabular-nums">
                          {formatShortDate(new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(l.startsAt)))}
                        </span>
                        <span className="w-12 shrink-0 text-muted-foreground tabular-nums">{formatTime(new Date(l.startsAt), tz)}</span>
                        <span className="flex-1 text-muted-foreground">
                          {SESSION_LABELS[l.sessionType]} · {l.clients} kişi
                        </span>
                        <span className="font-medium tabular-nums">{formatTRY(l.pay)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {owner && (
                <div className="mt-4 flex justify-end border-t pt-4">
                  <PayrollButtons
                    memberId={r.member.id}
                    month={month}
                    name={r.member.fullName}
                    amount={formatTRY(r.summary.amount)}
                    closed={r.closed ? { id: r.closed.id, paid: r.closed.paidAt !== null } : null}
                  />
                </div>
              )}
              {!owner && r.closed?.paidAt && <p className="mt-3 text-sm font-medium text-success-strong">Ödendi</p>}
            </section>
          ))}
          {owner && rows.some((r) => !r.member.payRule) && (
            <p className="text-sm text-muted-foreground">
              Ücret kuralı olmayan eğitmenlerin tutarı 0 görünür. Kuralı{" "}
              <Link href="/ayarlar/ekip" className="font-medium text-foreground underline underline-offset-2">
                Ekip
              </Link>{" "}
              sayfasından eğitmene dokunup belirleyebilirsin.
            </p>
          )}
        </div>
      )}
    </>
  );
}
