import Link from "next/link";
import { ChevronRight, ClipboardCheck, Inbox, Wallet } from "lucide-react";

function Banner({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
  return (
    <Link
      href={href}
      className="mb-3 flex items-center gap-3 rounded-2xl bg-lime px-4 py-3 text-lime-foreground transition-opacity last:mb-6 hover:opacity-90"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-lime-foreground/10 [&_svg]:size-4">{icon}</span>
      <span className="flex-1 text-sm font-semibold">{text}</span>
      <ChevronRight className="size-4" aria-hidden />
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

export function AttendanceBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return <Banner href="/yoklama" icon={<ClipboardCheck aria-hidden />} text={`Geçmiş günlerden ${count} yoklama bekliyor`} />;
}
