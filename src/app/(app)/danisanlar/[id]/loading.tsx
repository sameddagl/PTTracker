import { CardsSkeleton, HeaderSkeleton, ListSkeleton, LoadingScreen, SectionTitleSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back />
      <div className="mb-8 flex flex-wrap gap-2">
        <Skeleton className="h-11 w-28 rounded-lg md:h-9" />
        <Skeleton className="h-11 w-28 rounded-lg md:h-9" />
        <Skeleton className="h-11 w-28 rounded-lg md:h-9" />
      </div>
      <SectionTitleSkeleton />
      <CardsSkeleton count={1} lines={1} />
      <div className="mt-8">
        <SectionTitleSkeleton />
        <ListSkeleton rows={4} />
      </div>
    </LoadingScreen>
  );
}
