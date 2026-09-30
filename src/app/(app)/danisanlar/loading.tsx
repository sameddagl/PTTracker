import { HeaderSkeleton, ListSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton title="Danışanlar" action={false} />
      <ListSkeleton rows={7} />
    </LoadingScreen>
  );
}
