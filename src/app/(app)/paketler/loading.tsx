import { HeaderSkeleton, ListSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton title="Paketler" />
      <ListSkeleton rows={4} />
    </LoadingScreen>
  );
}
