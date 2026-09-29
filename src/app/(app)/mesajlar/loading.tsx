import { HeaderSkeleton, ListSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton title="Mesajlar" />
      <ListSkeleton rows={6} />
    </LoadingScreen>
  );
}
