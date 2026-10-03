import { CardsSkeleton, HeaderSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton title="Hakediş" />
      <CardsSkeleton count={2} lines={3} />
    </LoadingScreen>
  );
}
