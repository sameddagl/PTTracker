"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CircleCheck, Download, FileSpreadsheet, RotateCcw, ShieldAlert, Upload } from "lucide-react";
import { Field, FormError, NativeSelect } from "@/components/field";
import { SectionTitle } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatShortDate, formatTRY } from "@/lib/format";
import {
  IMPORT_FIELDS,
  IMPORT_FIELD_LABELS,
  MAX_IMPORT_ROWS,
  isHealthHeader,
  summarize,
  validateRows,
  type ColumnMapping,
  type ImportField,
  type RowResult,
} from "@/lib/import/clients";
import { formatPhone } from "@/lib/whatsapp";
import { importClientsAction, readImportFileAction, type ImportState, type ParsedFile, type ReadFileState } from "./actions";

const PREVIEW_ROWS = 10;

const FIELD_HINTS: Partial<Record<ImportField, string>> = {
  fullName: "zorunlu",
  firstName: "ad soyad ayrıysa",
  lastName: "ad soyad ayrıysa",
  remaining: "varsa paket açılır",
  expiresOn: "31.12.2026 gibi",
  debt: "paketten kalan ödeme",
};

export function ImportWizard() {
  const [state, action, reading] = useActionState<ReadFileState, FormData>(readImportFileAction, {});
  // "Başka dosya" hides the current result until the next upload answers.
  const [dismissed, setDismissed] = useState<ReadFileState>();
  // Bumped on every upload so the review step starts fresh for each file.
  const [upload, setUpload] = useState(0);
  const current = state === dismissed ? {} : state;

  if (current.file) return <Review key={upload} file={current.file} onReset={() => setDismissed(state)} />;

  return (
    <div className="flex flex-col gap-6">
      <form action={action} onSubmit={() => setUpload((n) => n + 1)} className="flex flex-col gap-5 surface p-5">
        <FormError message={current.error} />
        <Field id="file" label="Excel veya CSV dosyası" hint={`.xlsx, .csv · en fazla 2 MB, ${MAX_IMPORT_ROWS} danışan`}>
          <Input
            id="file"
            name="file"
            type="file"
            required
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="py-2.5 file:mr-3 file:h-7 file:rounded-full file:bg-muted file:px-3"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={reading}>
            <Upload />
            {reading ? "Okunuyor…" : "Dosyayı yükle"}
          </Button>
          <Button asChild variant="outline">
            <a href="/danisanlar/ice-aktar/ornek" download>
              <Download />
              Örnek dosyayı indir
            </a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          İlk satır başlık olmalı (Ad Soyad, Telefon, Kalan ders…). Sütun adları farklıysa bir sonraki adımda eşleştirebilirsin; yüklemek
          henüz hiçbir şey kaydetmez.
        </p>
      </form>
      <HealthNotice />
    </div>
  );
}

function HealthNotice() {
  return (
    <p className="flex items-start gap-3 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        Sağlık bilgisi aktarılmaz: KVKK gereği danışanın açık rızasını gerektirir. Aktardıktan sonra danışanın sayfasından, rızasını alarak
        ekleyebilirsin.
      </span>
    </p>
  );
}

/** Only the mapped columns travel back to the server, re-indexed from 0. */
function project(rows: string[][], mapping: ColumnMapping) {
  const used = [...new Set(Object.values(mapping).filter((i): i is number => i !== null))];
  const index = new Map(used.map((col, i) => [col, i]));
  const projected = Object.fromEntries(
    IMPORT_FIELDS.map((f) => [f, mapping[f] === null ? null : index.get(mapping[f]!)!]),
  ) as ColumnMapping;
  return { rows: rows.map((r) => used.map((col) => r[col] ?? "")), mapping: projected };
}

function Review({ file, onReset }: { file: ParsedFile; onReset: () => void }) {
  const [mapping, setMapping] = useState(file.mapping);
  const [pending, startImport] = useTransition();
  const [outcome, setOutcome] = useState<ImportState>({});

  const existing = useMemo(() => new Set(file.existingPhones), [file.existingPhones]);
  const results = useMemo(
    () => validateRows(file.rows, mapping, { existingPhones: existing, today: file.today, lines: file.lines }),
    [file, mapping, existing],
  );
  const summary = summarize(results);
  const hasName = mapping.fullName !== null || mapping.firstName !== null;

  const setField = (field: ImportField, value: string) =>
    setMapping((m) => {
      const next = { ...m, [field]: value === "" ? null : Number(value) };
      // Full name and first/last are alternatives.
      if (field === "fullName" && value !== "") Object.assign(next, { firstName: null, lastName: null });
      if ((field === "firstName" || field === "lastName") && value !== "") next.fullName = null;
      return next;
    });

  const runImport = () =>
    startImport(async () => {
      const payload = project(file.rows, mapping);
      setOutcome(await importClientsAction({ ...payload, lines: file.lines }));
    });

  if (outcome.result) return <Done result={outcome.result} onReset={onReset} />;

  const problems = results.filter((r) => r.status !== "ok");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3 surface py-3 pr-3 pl-4">
        <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{file.name}</span>
          <span className="block text-xs text-muted-foreground">{file.rows.length} satır</span>
        </span>
        <Button variant="ghost" size="sm" onClick={onReset} disabled={pending}>
          <RotateCcw />
          Başka dosya
        </Button>
      </div>

      <section aria-labelledby="mapping-title">
        <SectionTitle id="mapping-title">Sütunları eşleştir</SectionTitle>
        <div className="grid gap-4 surface p-5 sm:grid-cols-2">
          {IMPORT_FIELDS.map((field) => (
            <Field key={field} id={`map-${field}`} label={IMPORT_FIELD_LABELS[field]} hint={FIELD_HINTS[field]}>
              <NativeSelect
                id={`map-${field}`}
                value={mapping[field] ?? ""}
                onChange={(e) => setField(field, e.target.value)}
                disabled={pending}
              >
                <option value="">— Yok —</option>
                {file.headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h}
                    {isHealthHeader(h) ? " (sağlık)" : ""}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          ))}
        </div>
        <div className="mt-3">
          <HealthNotice />
        </div>
      </section>

      <section aria-labelledby="preview-title">
        <SectionTitle id="preview-title">Önizleme</SectionTitle>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <StatTile label="Eklenecek" value={summary.ok} hint={summary.packages > 0 ? `${summary.packages} paketle` : undefined} tone={summary.ok > 0 ? "lime" : "default"} />
          <StatTile label="Zaten var" value={summary.skip} hint="atlanacak" />
          <StatTile label="Hatalı" value={summary.error} hint="aktarılmaz" />
        </div>
        <ul className="divide-y overflow-hidden surface">
          {results.slice(0, PREVIEW_ROWS).map((r) => (
            <PreviewRow key={r.line} row={r} />
          ))}
        </ul>
        {file.rows.length > PREVIEW_ROWS && (
          <p className="mt-2 text-xs text-muted-foreground">
            İlk {PREVIEW_ROWS} satır gösteriliyor; kontrol {file.rows.length} satırın hepsine uygulanır.
          </p>
        )}
        {problems.some((p) => p.line > (results[PREVIEW_ROWS - 1]?.line ?? Infinity)) && (
          <details className="mt-4 surface px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium">Aktarılmayacak satırların hepsi ({problems.length})</summary>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {problems.map((p) => (
                <li key={p.line}>
                  <span className="font-medium tabular-nums">Satır {p.line}</span>
                  <span className="text-muted-foreground"> · {p.client.fullName || "İsimsiz"} · {p.reasons.join(", ")}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <div className="flex flex-col gap-3">
        <FormError message={!hasName ? "Ad soyad sütununu seç." : outcome.error} />
        <Button size="lg" className="sm:self-start" onClick={runImport} loading={pending} disabled={!hasName || summary.ok === 0}>
          {pending ? "Aktarılıyor…" : summary.ok > 0 ? `${summary.ok} danışanı aktar` : "Aktarılacak danışan yok"}
        </Button>
        {summary.skip + summary.error > 0 && summary.ok > 0 && (
          <p className="text-sm text-muted-foreground">Hatalı ve zaten kayıtlı satırlar atlanır; diğerleri tek seferde kaydedilir.</p>
        )}
      </div>
    </div>
  );
}

function PreviewRow({ row }: { row: RowResult }) {
  const { client: c } = row;
  const pkg = c.package;
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="w-8 shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">{row.line}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{c.fullName || <span className="text-muted-foreground">İsim yok</span>}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[
            c.phone && formatPhone(c.phone),
            c.email,
            pkg &&
              [
                pkg.totalSessions > 0 ? `${pkg.totalSessions} ders` : null,
                pkg.name,
                pkg.expiresOn ? `bitiş ${formatShortDate(pkg.expiresOn)}` : null,
                pkg.price > 0 ? `borç ${formatTRY(pkg.price)}` : null,
              ]
                .filter(Boolean)
                .join(" · "),
          ]
            .filter(Boolean)
            .join(" · ") || "Ek bilgi yok"}
        </p>
        {row.reasons.length > 0 && (
          <p className={row.status === "error" ? "mt-1 text-xs text-destructive-strong" : "mt-1 text-xs text-muted-foreground"}>
            {row.reasons.join(" · ")}
          </p>
        )}
        {row.status === "ok" && row.warnings.length > 0 && <p className="mt-1 text-xs text-warning-strong">{row.warnings.join(" · ")}</p>}
      </div>
      <StatusBadge status={row.status} />
    </li>
  );
}

function StatusBadge({ status }: { status: RowResult["status"] }) {
  if (status === "ok") return <Badge variant="success">Eklenecek</Badge>;
  if (status === "skip") return <Badge variant="secondary">Atlanacak</Badge>;
  return <Badge variant="destructive">Hatalı</Badge>;
}

function Done({ result, onReset }: { result: NonNullable<ImportState["result"]>; onReset: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div role="status" className="flex flex-col items-center gap-3 surface px-6 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-lime text-lime-foreground [&_svg]:size-6">
          <CircleCheck aria-hidden />
        </div>
        <p className="text-xl font-semibold">{result.created} danışan eklendi</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {result.packages > 0 ? `${result.packages} paket açıldı. ` : ""}
          {result.skipped.length > 0 ? `${result.skipped.length} satır atlandı.` : "Atlanan satır yok."}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/danisanlar">Danışanlara git</Link>
          </Button>
          <Button variant="outline" onClick={onReset}>
            Başka dosya aktar
          </Button>
        </div>
      </div>

      {result.skipped.length > 0 && (
        <section aria-labelledby="skipped-title">
          <SectionTitle id="skipped-title">Atlanan satırlar</SectionTitle>
          <ul className="divide-y overflow-hidden surface">
            {result.skipped.map((s) => (
              <li key={s.line} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-16 shrink-0 font-medium tabular-nums">Satır {s.line}</span>
                <span className="min-w-0 flex-1 text-muted-foreground">{s.reasons.join(" · ")}</span>
                <StatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
