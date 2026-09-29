import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";

export function ApplicationsBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Link
      href="/danisanlar/basvurular"
      className="mb-6 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 transition-colors hover:bg-primary/15"
    >
      <Inbox className="size-4 text-primary" aria-hidden />
      <span className="flex-1 text-sm font-medium">{count === 1 ? "1 yeni başvuru var" : `${count} yeni başvuru var`}</span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
    </Link>
  );
}
