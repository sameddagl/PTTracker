import { HeaderSkeleton, LoadingScreen, StatsSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton title="Takvim" action={false} />
      <StatsSkeleton />
      <div className="mb-4 grid grid-cols-7 gap-1 md:hidden">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
      <div className="flex flex-col gap-2 md:hidden">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <div data-wide className="hidden h-[32rem] overflow-hidden surface md:grid md:grid-cols-[3rem_repeat(7,1fr)]">
        <div className="border-r bg-muted/30" />
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 border-r p-2 last:border-r-0">
            <Skeleton className="h-5 w-12" />
            {i % 2 === 0 && <Skeleton className="mt-8 h-16" />}
            {i % 3 === 1 && <Skeleton className="mt-20 h-12" />}
          </div>
        ))}
      </div>
    </LoadingScreen>
  );
}
