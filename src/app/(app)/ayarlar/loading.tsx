import { CardsSkeleton, HeaderSkeleton, ListSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton title="Ayarlar" action={false} />
      <CardsSkeleton count={1} lines={2} />
      <div className="mt-4">
        <ListSkeleton rows={4} trailing={false} />
      </div>
    </LoadingScreen>
  );
}
