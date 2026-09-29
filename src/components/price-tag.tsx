import { formatTRY } from "@/lib/format";
import { discountPercent } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Price with the struck-through "was" price and a discount badge, when there
 * is one. `align="end"` for price columns on the right: the price sits at the
 * outer edge and the discount leads into it.
 */
export function PriceTag({
  price,
  compareAtPrice,
  size = "md",
  align = "end",
  className,
}: {
  price: string | number;
  compareAtPrice?: string | number | null;
  size?: "sm" | "md" | "lg";
  align?: "start" | "end";
  className?: string;
}) {
  const pct = discountPercent(compareAtPrice ?? null, price);
  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-baseline gap-x-2 gap-y-1",
        align === "end" ? "flex-row-reverse justify-start text-right" : "justify-start",
        className,
      )}
    >
      <span className={cn("font-semibold tabular-nums", size === "lg" ? "text-xl" : size === "md" ? "text-base" : "text-sm")}>
        {pct !== null && <span className="sr-only">İndirimli fiyat </span>}
        {formatTRY(price)}
      </span>
      {pct !== null && (
        <>
          <s className="text-sm text-muted-foreground tabular-nums">
            <span className="sr-only">Eski fiyat </span>
            {formatTRY(compareAtPrice!)}
          </s>
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success-strong">%{pct} indirim</span>
        </>
      )}
    </span>
  );
}
