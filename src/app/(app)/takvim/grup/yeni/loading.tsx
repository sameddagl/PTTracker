import { FormSkeleton, HeaderSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Yeni grup dersi" action={false} />
      <FormSkeleton />
    </LoadingScreen>
  );
}
