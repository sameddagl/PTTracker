import { CalendarCheck, CalendarDays, Check, Users, Wallet } from "lucide-react";

// A static, decorative preview of the Today screen. Built from the same
// tokens as the app so it stays in sync with the real UI; hidden from
// assistive tech because the surrounding copy already describes it. Its
// 10px labels are deliberate: it's a scaled-down miniature of the app.
export function PhoneMockup() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-72 select-none">
      <div className="rounded-[2.5rem] border-8 border-foreground/90 bg-background p-4 pt-8 shadow-2xl shadow-primary/10">
        <div className="absolute top-3 left-1/2 h-4 w-20 -translate-x-1/2 rounded-full bg-foreground/90" />
        <p className="font-heading text-xl font-semibold">Günaydın, Elif</p>
        <p className="mb-4 text-xs text-muted-foreground">Salı, 6 Ekim</p>

        <p className="mb-2 text-xs font-medium text-muted-foreground">Bugünün dersleri</p>
        <div className="mb-2 rounded-xl border bg-card p-3">
          <p className="mb-2 text-sm font-semibold tabular-nums">
            09:00–10:00 <span className="text-xs font-normal text-muted-foreground">Özel</span>
          </p>
          <div className="mb-2 flex items-baseline justify-between text-xs">
            <span className="font-medium">Zeynep K.</span>
            <span className="text-muted-foreground">5 ders kaldı</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-medium">
            <span className="rounded-md bg-success-strong py-2 text-background">Geldi</span>
            <span className="rounded-md border py-2 text-muted-foreground">Gelmedi</span>
            <span className="rounded-md border py-2 text-muted-foreground">Geç iptal</span>
            <span className="rounded-md border py-2 text-muted-foreground">İptal</span>
          </div>
        </div>
        <div className="mb-4 rounded-xl border bg-card p-3">
          <p className="mb-1 text-sm font-semibold tabular-nums">
            18:00–19:00 <span className="text-xs font-normal text-muted-foreground">Düet</span>
          </p>
          <p className="text-xs text-muted-foreground">Ayşe D., Mert A.</p>
        </div>

        <p className="mb-2 text-xs font-medium text-muted-foreground">Dikkat edilecekler</p>
        <div className="rounded-xl border bg-card p-3 text-xs">
          <p className="font-medium">Can E.</p>
          <p className="text-muted-foreground">8 Ders Özel · 1 ders kaldı</p>
        </div>

        <div className="mt-4 grid grid-cols-4 border-t pt-2 text-center text-[10px] text-muted-foreground">
          <span className="flex flex-col items-center gap-1 text-primary">
            <CalendarCheck className="size-4" />
            Bugün
          </span>
          <span className="flex flex-col items-center gap-1">
            <Users className="size-4" />
            Danışanlar
          </span>
          <span className="flex flex-col items-center gap-1">
            <Wallet className="size-4" />
            Ödemeler
          </span>
          <span className="flex flex-col items-center gap-1">
            <CalendarDays className="size-4" />
            Takvim
          </span>
        </div>
      </div>

      {/* Floating cards: what arrives while the trainer is teaching. */}
      <div className="absolute top-24 -left-6 hidden w-48 rounded-xl border bg-card p-3 shadow-lg sm:block">
        <p className="flex items-center gap-2 text-xs font-medium">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="size-3.5" />
          </span>
          Yeni başvuru
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Deniz Y. · 12 Ders Özel</p>
      </div>
      <div className="absolute -right-8 bottom-28 hidden w-48 rounded-xl border bg-card p-3 shadow-lg sm:block">
        <p className="flex items-center gap-2 text-xs font-medium">
          <span className="flex size-6 items-center justify-center rounded-full bg-success/10 text-success-strong">
            <Check className="size-3.5" />
          </span>
          Ödeme bildirimi
        </p>
        <p className="mt-1 text-xs text-muted-foreground">2. taksit · ₺1.333 · dekontlu</p>
      </div>
    </div>
  );
}
