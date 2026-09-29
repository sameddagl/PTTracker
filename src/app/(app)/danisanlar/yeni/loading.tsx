import { FormSkeleton, HeaderSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Yeni danışan" action={false} />
      <FormSkeleton />
    </LoadingScreen>
  );
}
