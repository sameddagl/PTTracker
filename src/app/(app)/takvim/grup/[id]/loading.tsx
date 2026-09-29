import { HeaderSkeleton, ListSkeleton, LoadingScreen, SectionTitleSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back action={false} />
      <SectionTitleSkeleton />
      <ListSkeleton rows={4} />
      <div className="mt-8">
        <SectionTitleSkeleton />
        <ListSkeleton rows={3} trailing={false} />
      </div>
    </LoadingScreen>
  );
}
