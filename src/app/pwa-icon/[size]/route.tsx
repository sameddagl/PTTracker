import { ImageResponse } from "next/og";

const SIZES = [180, 192, 512] as const;

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

// PNG icons for the web app manifest and iOS home screen, drawn from the same
// mark as app/icon.svg. Full-bleed so "maskable" crops cleanly.
export async function GET(_req: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const size = Number((await ctx.params).size);
  if (!SIZES.includes(size as (typeof SIZES)[number])) return new Response("Not found", { status: 404 });

  const stroke = size * 0.09;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0f766e" }}>
        <svg viewBox="0 0 64 64" width={size} height={size}>
          <path
            d="M20 34l8 8 16-18"
            fill="none"
            stroke="#fff"
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
