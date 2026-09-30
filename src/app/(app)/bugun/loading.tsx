import { CardsSkeleton, HeaderSkeleton, ListSkeleton, LoadingScreen, SectionTitleSkeleton, StatsSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton action={false} />
      <StatsSkeleton />
      <section className="mb-8">
        <SectionTitleSkeleton />
        <CardsSkeleton count={2} />
      </section>
      <SectionTitleSkeleton />
      <ListSkeleton rows={2} />
    </LoadingScreen>
  );
}
