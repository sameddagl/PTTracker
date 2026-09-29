import { HeaderSkeleton, ListSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton title="Yardım" back action={false} />
      <ListSkeleton rows={8} trailing={false} />
    </LoadingScreen>
  );
}
