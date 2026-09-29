import { Link2Off } from "lucide-react";

// Shown for revoked, renewed or mistyped portal links.
export default function PortalNotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 surface px-6 py-10 text-center">
        <span className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground" aria-hidden>
          <Link2Off className="size-6" />
        </span>
        <h1 className="text-xl font-semibold">Bu link artık geçerli değil</h1>
        <p className="text-sm text-muted-foreground">
          Eğitmenin linki yenilemiş ya da kapatmış olabilir. Güncel linki eğitmeninden isteyebilirsin.
        </p>
      </div>
    </main>
  );
}
