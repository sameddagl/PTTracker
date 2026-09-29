import { CardsSkeleton, HeaderSkeleton, LoadingScreen, SectionTitleSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton action={false} />
      <SectionTitleSkeleton />
      <CardsSkeleton count={3} />
    </LoadingScreen>
  );
}
