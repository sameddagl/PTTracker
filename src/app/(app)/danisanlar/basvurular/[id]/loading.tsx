import { CardsSkeleton, HeaderSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back action={false} />
      <CardsSkeleton count={3} lines={1} />
    </LoadingScreen>
  );
}
