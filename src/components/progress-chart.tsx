"use client";

import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatMetric, seriesChange, spanPhrase, type MetricDef, type Point, type Series } from "@/lib/measurements";
import { cn } from "@/lib/utils";

// Progress charts for the trainer's client page and the client's own page:
// a tile per metric (latest value, change, sparkline) and one large chart for
// the selected metric. Plain SVG drawn at the container's pixel width.

const shortDate = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fmtShort = (d: string) => shortDate.format(new Date(`${d}T00:00:00Z`));
const fmtLong = (d: string) => longDate.format(new Date(`${d}T00:00:00Z`));

/** Monotone cubic path (Fritsch–Carlson), so the line never overshoots the data. */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  const n = pts.length;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    slope.push((pts[i + 1].y - pts[i].y) / (dx[i] || 1));
  }
  const m: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) m.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
  m.push(slope[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * slope[i];
      m[i + 1] = t * b * slope[i];
    }
  }
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const c = dx[i] / 3;
    d += ` C${pts[i].x + c},${pts[i].y + m[i] * c} ${pts[i + 1].x - c},${pts[i + 1].y - m[i + 1] * c} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
}

/** Up to `count` round tick values covering [min, max]. */
function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || Math.abs(max) || 1;
  const raw = span / (count - 1);
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * pow).find((s) => s >= raw) ?? raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function layout(points: Point[], w: number, h: number, pad: { l: number; r: number; t: number; b: number }) {
  const times = points.map((p) => Date.parse(p.date));
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const values = points.map((p) => p.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1] === lo ? lo + 1 : ticks[ticks.length - 1];
  const x = (t: number) => (t1 === t0 ? pad.l + (w - pad.l - pad.r) / 2 : pad.l + ((t - t0) / (t1 - t0)) * (w - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (h - pad.t - pad.b);
  return { pts: points.map((p, i) => ({ x: x(times[i]), y: y(p.value) })), ticks, y };
}

/** The large chart: grid, smooth line over a lime fill, a dot per measurement and a tap/hover readout. */
export function ProgressChart({ points, metric, height = 220 }: { points: Point[]; metric: MetricDef; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const gradient = useId();
  const pad = { l: 44, r: 16, t: 16, b: 28 };
  const geo = useMemo(() => (width > 0 && points.length > 0 ? layout(points, width, height, pad) : null), [points, width, height]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = active ?? points.length - 1;
  const line = geo ? smoothPath(geo.pts) : "";
  const area = geo && geo.pts.length > 1 ? `${line} L${geo.pts[geo.pts.length - 1].x},${height - pad.b} L${geo.pts[0].x},${height - pad.b} Z` : "";
  // Three date labels at most, so they never collide on a phone.
  const labelIdx = points.length <= 3 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  function pick(clientX: number) {
    if (!geo || !ref.current) return;
    const x = clientX - ref.current.getBoundingClientRect().left;
    let best = 0;
    for (let i = 1; i < geo.pts.length; i++) if (Math.abs(geo.pts[i].x - x) < Math.abs(geo.pts[best].x - x)) best = i;
    setActive(best);
  }

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      {geo && (
        <svg
          width={width}
          height={height}
          className="block touch-pan-y text-foreground"
          role="img"
          aria-label={`${metric.label} grafiği: ${points.map((p) => `${fmtShort(p.date)} ${formatMetric(p.value, metric)}`).join(", ")}`}
          onPointerMove={(e) => pick(e.clientX)}
          onPointerDown={(e) => pick(e.clientX)}
          onPointerLeave={() => setActive(null)}
        >
          <defs>
            <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--lime)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--lime)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={geo.y(t)} y2={geo.y(t)} stroke="currentColor" strokeOpacity="0.08" />
              <text x={pad.l - 8} y={geo.y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                {formatMetric(t, { ...metric, unit: "" })}
              </text>
            </g>
          ))}
          {labelIdx.map((i) => (
            <text
              key={i}
              x={geo.pts[i].x}
              y={height - 8}
              textAnchor={labelIdx.length > 1 && i === 0 ? "start" : labelIdx.length > 1 && i === points.length - 1 ? "end" : "middle"}
              className="fill-muted-foreground text-[11px]"
            >
              {fmtShort(points[i].date)}
            </text>
          ))}
          {area && <path d={area} fill={`url(#${gradient})`} />}
          {geo.pts.length > 1 && <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          {active !== null && (
            <line x1={geo.pts[shown].x} x2={geo.pts[shown].x} y1={pad.t} y2={height - pad.b} stroke="currentColor" strokeOpacity="0.25" strokeDasharray="3 3" />
          )}
          {geo.pts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === shown ? 6 : 3.5}
              fill={i === shown ? "var(--lime)" : "var(--card)"}
              stroke="currentColor"
              strokeWidth={i === shown ? 2.5 : 2}
            />
          ))}
        </svg>
      )}
      {geo && (
        <div
          className="pointer-events-none absolute top-0 rounded-xl bg-foreground px-2.5 py-1.5 text-center text-background shadow-float"
          style={{ left: Math.min(Math.max(geo.pts[shown].x, 56), width - 56), transform: `translate(-50%, ${Math.max(geo.pts[shown].y - 64, -8)}px)` }}
          aria-hidden
        >
          <span className="block text-sm leading-tight font-semibold whitespace-nowrap tabular-nums">{formatMetric(points[shown].value, metric)}</span>
          <span className="block text-[11px] leading-tight opacity-70">{fmtShort(points[shown].date)}</span>
        </div>
      )}
    </div>
  );
}

/** A small trend line for the metric tiles; stretches to the tile's width. */
function Sparkline({ points }: { points: Point[] }) {
  const w = 100;
  const h = 28;
  if (points.length < 2) return <span className="block h-7" aria-hidden />;
  const { pts } = layout(points, w, h, { l: 2, r: 4, t: 4, b: 4 });
  const end = pts[pts.length - 1];
  return (
    <span className="relative block h-7 text-foreground" aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block h-full w-full">
        <path d={smoothPath(pts)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-current bg-lime"
        style={{ left: `${(end.x / w) * 100}%`, top: `${(end.y / h) * 100}%` }}
      />
    </span>
  );
}

function ChangeLine({ points, metric }: { points: Point[]; metric: MetricDef }) {
  const change = seriesChange(points);
  if (!change) return <span className="text-xs text-muted-foreground">İlk ölçüm</span>;
  if (change.delta === 0) return <span className="text-xs text-muted-foreground">Değişmedi · {spanPhrase(change.days)}</span>;
  const Icon = change.delta < 0 ? TrendingDown : TrendingUp;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="size-3.5" aria-hidden />
      <span className="font-medium text-foreground tabular-nums">{formatMetric(change.delta, metric, { sign: true })}</span>· {spanPhrase(change.days)}
    </span>
  );
}

/** Metric tiles plus the large chart for the chosen one, with the readings listed under it. */
export function ProgressView({ series, emptyText }: { series: Series[]; emptyText: string }) {
  const [selected, setSelected] = useState(series[0]?.metric.key);
  const current = series.find((s) => s.metric.key === selected) ?? series[0];
  if (!current) return <p className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{emptyText}</p>;
  const last = current.points[current.points.length - 1];

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Ölçüler">
        {series.map((s) => {
          const latest = s.points[s.points.length - 1];
          const on = s.metric.key === current.metric.key;
          return (
            <li key={s.metric.key}>
              <button
                type="button"
                onClick={() => setSelected(s.metric.key)}
                aria-pressed={on}
                className={cn(
                  "flex w-full flex-col gap-2 rounded-2xl border bg-card p-3 text-left transition-shadow outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  on ? "border-transparent ring-2 ring-lime" : "hover:shadow-card",
                )}
              >
                <span className="truncate text-xs text-muted-foreground">{s.metric.label}</span>
                <span className="text-xl leading-none font-semibold tracking-tight whitespace-nowrap tabular-nums">
                  {formatMetric(latest.value, { ...s.metric, unit: "" })}
                  {s.metric.unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{s.metric.unit}</span>}
                </span>
                <Sparkline points={s.points} />
                <ChangeLine points={s.points} metric={s.metric} />
              </button>
            </li>
          );
        })}
      </ul>

      <section aria-label={`${current.metric.label} grafiği`} className="flex flex-col gap-3 surface p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">{current.metric.label}</p>
            <p className="text-3xl leading-tight font-semibold tracking-tight tabular-nums">{formatMetric(last.value, current.metric)}</p>
          </div>
          <ChangeLine points={current.points} metric={current.metric} />
        </div>
        <ProgressChart points={current.points} metric={current.metric} />
        <details className="group text-sm">
          <summary className="flex min-h-11 cursor-pointer list-none items-center text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            Bütün ölçümler ({current.points.length})
          </summary>
          <ul className="divide-y rounded-xl border">
            {[...current.points].reverse().map((p) => (
              <li key={p.date} className="flex items-center justify-between px-3 py-2">
                <span className="text-muted-foreground">{fmtLong(p.date)}</span>
                <span className="font-medium tabular-nums">{formatMetric(p.value, current.metric)}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
