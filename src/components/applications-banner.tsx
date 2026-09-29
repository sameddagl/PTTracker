import Link from "next/link";
import { ChevronRight, Inbox, Wallet } from "lucide-react";

function Banner({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
  return (
    <Link
      href={href}
      className="mb-3 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 transition-colors last:mb-6 hover:bg-primary/15"
    >
      <span className="text-primary [&_svg]:size-4">{icon}</span>
      <span className="flex-1 text-sm font-medium">{text}</span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
    </Link>
  );
}

export function ApplicationsBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return <Banner href="/danisanlar/basvurular" icon={<Inbox aria-hidden />} text={count === 1 ? "1 yeni başvuru var" : `${count} yeni başvuru var`} />;
}

export function PaymentsBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Banner
      href="/odemeler"
      icon={<Wallet aria-hidden />}
      text={count === 1 ? "1 ödeme bildirimi onay bekliyor" : `${count} ödeme bildirimi onay bekliyor`}
    />
  );
}
