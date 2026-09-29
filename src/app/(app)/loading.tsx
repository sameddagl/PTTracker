import { HeaderSkeleton, ListSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton />
      <ListSkeleton />
    </LoadingScreen>
  );
}
