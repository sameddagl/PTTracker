"use client";

import { anteriorData, posteriorData, type Region } from "@/lib/body-outline";
import { MUSCLES, type MuscleKey } from "@/lib/muscles";
import { cn } from "@/lib/utils";

// Front and back body figures with the worked muscles painted: primary in
// lime, secondary in a lighter lime. With `onToggle` a tap on a region cycles
// it (none → primary → secondary → none), for the exercise editor.

/**
 * The muscle a shape belongs to. The front view draws the upper trapezius as
 * "neck" (between the collarbones and the jaw), so it counts as trapezius
 * there; the soleus shapes on the back view are part of the calves.
 */
const owner = (r: Region, front: boolean): MuscleKey | null =>
  r === "left-soleus" || r === "right-soleus" ? "calves" : front && r === "neck" ? "trapezius" : r in MUSCLES ? (r as MuscleKey) : null;

// The body in a faint tint of the text colour, so it reads on light and dark cards alike.
const BASE = "color-mix(in oklab, var(--foreground) 16%, transparent)";
const SECONDARY = "color-mix(in oklab, var(--lime) 50%, transparent)";

function Figure({
  data,
  label,
  primary,
  secondary,
  onToggle,
  compact,
}: {
  data: typeof anteriorData;
  label: string;
  compact?: boolean;
  primary: Set<MuscleKey>;
  secondary: Set<MuscleKey>;
  onToggle?: (m: MuscleKey) => void;
}) {
  return (
    <figure className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <svg viewBox="0 0 100 200" className={cn("h-auto w-full", !compact && "max-w-36")} role="img" aria-label={label}>
        {data.map((shape) => {
          const m = owner(shape.muscle, data === anteriorData);
          const fill = m && primary.has(m) ? "var(--lime)" : m && secondary.has(m) ? SECONDARY : BASE;
          return shape.svgPoints.map((points, i) => (
            <polygon
              key={`${shape.muscle}-${i}`}
              points={points}
              fill={fill}
              stroke="var(--background)"
              strokeWidth="0.6"
              strokeLinejoin="round"
              className={cn(onToggle && m && "cursor-pointer transition-opacity hover:opacity-80")}
              onClick={onToggle && m ? () => onToggle(m) : undefined}
            >
              {m && <title>{MUSCLES[m]}</title>}
            </polygon>
          ));
        })}
      </svg>
      {!compact && <figcaption className="text-xs text-muted-foreground">{label}</figcaption>}
    </figure>
  );
}

export function MuscleMap({
  primary,
  secondary = [],
  onToggle,
  legend = true,
  compact = false,
  className,
}: {
  primary: MuscleKey[];
  secondary?: MuscleKey[];
  onToggle?: (m: MuscleKey) => void;
  legend?: boolean;
  /** Small figures without captions, for cards and list rows. */
  compact?: boolean;
  className?: string;
}) {
  const p = new Set(primary);
  const s = new Set(secondary.filter((m) => !primary.includes(m)));
  const names = (list: MuscleKey[]) => list.map((m) => MUSCLES[m]).join(", ");
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className={cn("flex", compact ? "gap-1" : "gap-4")} aria-hidden={!onToggle}>
        <Figure data={anteriorData} label="Ön" primary={p} secondary={s} onToggle={onToggle} compact={compact} />
        <Figure data={posteriorData} label="Arka" primary={p} secondary={s} onToggle={onToggle} compact={compact} />
      </div>
      {legend && !compact && (primary.length > 0 || secondary.length > 0) && (
        <dl className="flex flex-col gap-1 text-xs">
          {primary.length > 0 && (
            <div className="flex gap-2">
              <dt className="flex shrink-0 items-center gap-1.5 font-medium">
                <span className="size-2.5 rounded-full bg-lime" aria-hidden />
                Ana kaslar
              </dt>
              <dd className="text-muted-foreground">{names(primary)}</dd>
            </div>
          )}
          {secondary.length > 0 && (
            <div className="flex gap-2">
              <dt className="flex shrink-0 items-center gap-1.5 font-medium">
                <span className="size-2.5 rounded-full bg-lime/50" aria-hidden />
                Yardımcı
              </dt>
              <dd className="text-muted-foreground">{names(secondary)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
