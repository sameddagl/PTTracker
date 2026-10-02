import { ImageResponse } from "next/og";

/** 48 and 96 are the favicon (rounded like icon.svg); the rest are full-bleed for the manifest and iOS. */
const SIZES = [48, 96, 180, 192, 512] as const;
const FAVICON = new Set<number>([48, 96]);

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

// PNG icons for the web app manifest and iOS home screen, drawn from the same
// mark as app/icon.svg. Full-bleed so "maskable" crops cleanly.
export async function GET(_req: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const size = Number((await ctx.params).size);
  if (!SIZES.includes(size as (typeof SIZES)[number])) return new Response("Not found", { status: 404 });

  const stroke = size * 0.075;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#c6f24e", borderRadius: FAVICON.has(size) ? size / 4 : 0 }}>
        <svg viewBox="0 0 64 64" width={size} height={size}>
          <path
            d="M12 32h8l6-18 12 36 6-18h8"
            fill="none"
            stroke="#1d1d1f"
            strokeWidth={(stroke / size) * 64}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
