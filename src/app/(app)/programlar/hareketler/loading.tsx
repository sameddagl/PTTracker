import { HeaderSkeleton, ListSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Hareketler" action={false} />
      <ListSkeleton rows={8} trailing={false} />
    </LoadingScreen>
  );
}
