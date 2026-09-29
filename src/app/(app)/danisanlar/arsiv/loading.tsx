import { HeaderSkeleton, ListSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Arşiv" action={false} />
      <ListSkeleton rows={3} trailing={false} />
    </LoadingScreen>
  );
}
