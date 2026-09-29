import { HeaderSkeleton, ListSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Grup dersleri" />
      <ListSkeleton rows={3} />
    </LoadingScreen>
  );
}
