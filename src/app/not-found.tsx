import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">Sayfa bulunamadı</h1>
      <p className="text-sm text-muted-foreground">Aradığın sayfa silinmiş ya da hiç var olmamış olabilir.</p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/bugun">Uygulamaya dön</Link>
      </Button>
    </main>
  );
}
