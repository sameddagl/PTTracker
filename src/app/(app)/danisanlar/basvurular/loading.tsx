import { HeaderSkeleton, ListSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Başvurular" action={false} />
      <ListSkeleton rows={4} />
    </LoadingScreen>
  );
}
