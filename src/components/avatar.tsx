import { cn } from "@/lib/utils";

// A few calm tints so a list of clients isn't a column of identical grey dots.
const TINTS = [
  "bg-[#e8f5c8] text-[#3f5a0a] dark:bg-[#2c3a12] dark:text-[#d9f28c]",
  "bg-[#e5e7fb] text-[#343a8f] dark:bg-[#23264a] dark:text-[#c3c7ff]",
  "bg-[#fde8dc] text-[#8a3b12] dark:bg-[#3d2418] dark:text-[#ffc7a8]",
  "bg-[#dff3ee] text-[#135c4b] dark:bg-[#15352d] dark:text-[#a6ecd9]",
  "bg-[#f7e3f1] text-[#7a2461] dark:bg-[#3a1a31] dark:text-[#f5bfe4]",
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr"))
    .join("");

/** A photo when there is one, else initials in a tinted circle; the tint is stable per name. */
export function Avatar({ name, size = "md", className, src }: { name: string; size?: "sm" | "md" | "lg"; className?: string; src?: string | null }) {
  const sizeClass = size === "sm" ? "size-8" : size === "md" ? "size-10" : "size-14";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- storage URL, resized to 512px on upload
    return <img src={src} alt="" aria-hidden className={cn("shrink-0 rounded-full object-cover", sizeClass, className)} />;
  }
  const tint = TINTS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TINTS.length];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" ? "size-8 text-xs" : size === "md" ? "size-10 text-sm" : "size-14 text-lg",
        tint,
        className,
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}
