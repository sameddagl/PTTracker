import { HeaderSkeleton, ListSkeleton, LoadingScreen, SectionTitleSkeleton, StatsSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton title="Ödemeler" />
      <StatsSkeleton />
      <SectionTitleSkeleton />
      <ListSkeleton rows={5} />
    </LoadingScreen>
  );
}
