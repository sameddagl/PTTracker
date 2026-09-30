import { HeaderSkeleton, ListSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Bildirimler" action={false} />
      <ListSkeleton rows={5} />
    </LoadingScreen>
  );
}
