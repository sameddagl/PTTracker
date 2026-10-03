import type { Program } from "@/db/programs";
import { MuscleMap } from "@/components/muscle-map";
import { PrintButton } from "@/components/print-button";
import { APP_DOMAIN } from "@/lib/config";
import { formatShortDate } from "@/lib/format";
import { MUSCLES, combineMuscles } from "@/lib/muscles";
import { NUTRITION_DISCLAIMER, NUTRITION_TARGETS, itemSummary } from "@/lib/programs";

// A program on one printable page, built on request and never stored: the
// browser's print dialog turns it into paper or a PDF ("PDF olarak kaydet").

export function ProgramSheet({ program, clientName, trainerName }: { program: Program; clientName: string | null; trainerName: string }) {
  const workout = program.kind === "workout";
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 print:max-w-none print:p-0">
        <div className="flex flex-col items-start gap-2 print:hidden">
          <PrintButton />
          <p className="text-xs text-muted-foreground">Yazdırma penceresinde hedef olarak “PDF olarak kaydet”i seçersen dosya olarak iner.</p>
        </div>

        <header className="flex flex-col gap-1 border-b pb-4">
          <p className="eyebrow">{workout ? "Antrenman programı" : "Beslenme planı"}</p>
          <h1 className="text-2xl leading-tight font-semibold">{program.name}</h1>
          <p className="text-sm text-muted-foreground">
            {[clientName, `Hazırlayan: ${trainerName}`, program.startsOn && `${formatShortDate(program.startsOn)} başlangıç`].filter(Boolean).join(" · ")}
          </p>
          {program.note && <p className="mt-2 text-sm whitespace-pre-wrap">{program.note}</p>}
        </header>

        <ProgramBody program={program} />

        <footer className="flex flex-col gap-2 border-t pt-4 text-xs text-muted-foreground">
          {!workout && <p>{NUTRITION_DISCLAIMER}</p>}
          <p>{APP_DOMAIN}</p>
        </footer>
      </div>
    </div>
  );
}

/** Targets and days of a program, read-only: the print sheet and a template someone else made. */
export function ProgramBody({ program }: { program: Program }) {
  const workout = program.kind === "workout";
  const targets = NUTRITION_TARGETS.filter((t) => program.targets[t.key]);
  return (
    <>
      {targets.length > 0 && (
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {targets.map((t) => (
            <div key={t.key} className="rounded-xl border px-3 py-2">
              <dt className="text-xs text-muted-foreground">Günlük {t.label.toLocaleLowerCase("tr")}</dt>
              <dd className="font-semibold">{program.targets[t.key]}</dd>
            </div>
          ))}
        </dl>
      )}

      {program.days.map((d) => {
        const muscles = workout ? combineMuscles(d.items) : null;
        return (
          <section key={d.id} className="break-inside-avoid-page">
            <h2 className="mb-2 text-lg font-semibold">{d.title}</h2>
            <div className="flex gap-4">
              <ol className="min-w-0 flex-1 divide-y rounded-xl border text-sm">
                {d.items.map((i, n) => (
                  <li key={i.id} className="flex gap-3 px-3 py-2 break-inside-avoid">
                    {workout && <span className="w-5 shrink-0 font-semibold tabular-nums">{n + 1}.</span>}
                    <span className="min-w-0 flex-1">
                      <span className={workout ? "font-medium" : "whitespace-pre-wrap"}>{i.name}</span>
                      {workout && itemSummary(i) && <span className="block text-muted-foreground tabular-nums sm:ml-2 sm:inline print:ml-2 print:inline">{itemSummary(i)}</span>}
                      {workout && i.primary.length > 0 && (
                        <span className="block text-xs text-muted-foreground">{i.primary.map((m) => MUSCLES[m]).join(" · ")}</span>
                      )}
                      {i.note && <span className="block text-xs">{i.note}</span>}
                    </span>
                  </li>
                ))}
              </ol>
              {muscles && muscles.primary.length > 0 && <MuscleMap {...muscles} compact legend={false} className="hidden w-28 shrink-0 self-start sm:flex print:flex" />}
            </div>
          </section>
        );
      })}
    </>
  );
}
