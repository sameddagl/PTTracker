import { HeaderSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Bize yazın" action={false} />
      <div className="h-80 animate-pulse rounded-2xl bg-muted" />
    </LoadingScreen>
  );
}
