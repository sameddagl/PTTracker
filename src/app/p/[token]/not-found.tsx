import { Link2Off } from "lucide-react";

// Shown for revoked, renewed or mistyped portal links.
export default function PortalNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <Link2Off className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-semibold">Bu link artık geçerli değil</h1>
      <p className="text-sm text-muted-foreground">
        Eğitmenin linki yenilemiş ya da kapatmış olabilir. Güncel linki eğitmeninden isteyebilirsin.
      </p>
    </main>
  );
}
