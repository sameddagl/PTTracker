import { LoadingScreen } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingScreen>
      <Skeleton className="mb-3 h-5 w-24" />
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="flex h-[calc(100dvh-17rem)] min-h-80 flex-col surface md:h-[calc(100dvh-14rem)]">
        <div className="flex flex-1 flex-col justify-end gap-3 p-4">
          <Skeleton className="h-10 w-3/5 rounded-2xl" />
          <Skeleton className="h-10 w-2/5 self-end rounded-2xl" />
          <Skeleton className="h-16 w-1/2 rounded-2xl" />
          <Skeleton className="h-10 w-1/3 self-end rounded-2xl" />
        </div>
        <div className="flex gap-2 border-t p-2 md:p-3">
          <Skeleton className="h-11 flex-1 rounded-3xl md:h-10" />
          <Skeleton className="size-11 rounded-full md:size-10" />
        </div>
      </div>
    </LoadingScreen>
  );
}
