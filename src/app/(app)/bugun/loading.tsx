import { CardsSkeleton, HeaderSkeleton, ListSkeleton, LoadingScreen, SectionTitleSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton />
      <section className="mb-8">
        <SectionTitleSkeleton />
        <CardsSkeleton count={2} />
      </section>
      <SectionTitleSkeleton />
      <ListSkeleton rows={2} />
    </LoadingScreen>
  );
}
