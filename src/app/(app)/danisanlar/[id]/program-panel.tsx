import Link from "next/link";
import { CalendarCheck, Dumbbell, FilePlus2, Pencil, Printer, Salad } from "lucide-react";
import { EmptyState } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Program } from "@/db/programs";
import { formatShortDate } from "@/lib/format";
import { NUTRITION_TARGETS, itemSummary } from "@/lib/programs";
import { giveProgramAction } from "../../programlar/actions";
import { SendProgramButton } from "./send-program-button";

const dateOf = (d: Date) => formatShortDate(d.toISOString().slice(0, 10));

/** A client's workout program (or nutrition plan): the current one, adherence, and how to give a new one. */
export function ProgramPanel({
  kind,
  clientId,
  firstName,
  programs,
  templates,
  checkins,
  archived,
}: {
  kind: "workout" | "nutrition";
  clientId: string;
  firstName: string;
  programs: Program[];
  templates: { id: string; name: string; days: number }[];
  checkins: { programId: string; doneOn: string }[];
  archived: boolean;
}) {
  const workout = kind === "workout";
  const [current, ...older] = programs;
  const blank = `/programlar/yeni?danisan=${clientId}${workout ? "" : "&tur=beslenme"}`;
  const done = current ? checkins.filter((c) => c.programId === current.id) : [];
  // Edited after sending: the client already sees the change, but a nudge to tell them is useful.
  const changed = current?.sentAt && current.updatedAt.getTime() - current.sentAt.getTime() > 60_000;

  const give = !archived && (
    <section aria-labelledby={`give-${kind}`} className="flex flex-col gap-3">
      <h2 id={`give-${kind}`} className="text-base font-semibold">
        {current ? (workout ? "Yeni program ver" : "Yeni plan ver") : workout ? "Program ver" : "Beslenme planı ver"}
      </h2>
      <ul className="divide-y overflow-hidden surface">
        {templates.map((t) => (
          <li key={t.id}>
            <form action={giveProgramAction.bind(null, clientId, t.id)} className="flex items-center gap-3 px-4 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{t.name}</span>
                <span className="block text-xs text-muted-foreground">
                  Şablon · {t.days} {workout ? "gün" : "öğün"}
                </span>
              </span>
              <SubmitButton size="sm" variant="outline" always>
                Kopyala
              </SubmitButton>
            </form>
          </li>
        ))}
        <li>
          <Link href={blank} className="flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-muted/50">
            <FilePlus2 className="size-4 text-muted-foreground" aria-hidden />
            {workout ? "Boş programla başla" : "Boş planla başla"}
          </Link>
        </li>
      </ul>
      {templates.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Sık verdiğin {workout ? "programları" : "planları"}{" "}
          <Link href={`/programlar${workout ? "" : "?tur=beslenme"}`} className="underline underline-offset-4">
            şablon olarak kaydedersen
          </Link>{" "}
          burada tek dokunuşla kopyalarsın.
        </p>
      )}
    </section>
  );

  if (!current) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState icon={workout ? <Dumbbell /> : <Salad />} title={workout ? "Henüz program yok" : "Henüz beslenme planı yok"}>
          {workout
            ? `${firstName} için bir antrenman programı hazırla; gönderince sayfasındaki Programım sekmesinde görür ve yaptığı günleri işaretler.`
            : `${firstName} için bir beslenme planı hazırla; gönderince sayfasındaki Beslenme sekmesinde görür.`}
        </EmptyState>
        {give}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby={`current-${kind}`} className="flex flex-col gap-4 surface p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={`current-${kind}`} className="text-lg leading-tight font-semibold">
              {current.name}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {current.startsOn ? `${formatShortDate(current.startsOn)} başlangıç · ` : ""}
              {current.sentAt ? `${dateOf(current.sentAt)} gönderildi` : "Taslak"}
            </p>
          </div>
          {current.sentAt ? <Badge variant="success">{firstName} görüyor</Badge> : <Badge variant="secondary">Gönderilmedi</Badge>}
        </div>

        {workout && current.sentAt && (
          <p className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm">
            <CalendarCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            {done.length > 0 ? (
              <span>
                Son 4 haftada <strong className="font-semibold">{done.length} antrenman</strong> yaptı · son {formatShortDate(done[0].doneOn)}
              </span>
            ) : (
              <span className="text-muted-foreground">Henüz “yaptım” işaretlemedi.</span>
            )}
          </p>
        )}

        {!workout && Object.keys(current.targets).length > 0 && (
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {NUTRITION_TARGETS.filter((t) => current.targets[t.key]).map((t) => (
              <div key={t.key} className="rounded-xl bg-muted/60 px-3 py-2">
                <dt className="text-xs text-muted-foreground">{t.label}</dt>
                <dd className="font-semibold">{current.targets[t.key]}</dd>
              </div>
            ))}
          </dl>
        )}

        <ol className="flex flex-col gap-3">
          {current.days.map((d) => (
            <li key={d.id}>
              <p className="mb-1 text-sm font-semibold">{d.title}</p>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {d.items.map((i) => (
                  <li key={i.id} className="flex flex-wrap gap-x-2">
                    <span className="text-foreground">{i.name}</span>
                    {workout && <span>{itemSummary(i)}</span>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        {!archived && (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            {(!current.sentAt || changed) && <SendProgramButton id={current.id} again={Boolean(current.sentAt)} firstName={firstName} />}
            <Button asChild variant="outline">
              <Link href={`/programlar/${current.id}`}>
                <Pencil />
                Düzenle
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <a href={`/yazdir/${current.id}`} target="_blank">
                <Printer />
                Yazdır / PDF
              </a>
            </Button>
          </div>
        )}
      </section>

      {give}

      {older.length > 0 && (
        <section aria-labelledby={`older-${kind}`}>
          <h2 id={`older-${kind}`} className="mb-3 text-base font-semibold">
            Önceki {workout ? "programlar" : "planlar"}
          </h2>
          <ul className="divide-y overflow-hidden surface">
            {older.map((p) => (
              <li key={p.id}>
                <Link href={`/programlar/${p.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50">
                  <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.sentAt ? dateOf(p.sentAt) : "Taslak"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
