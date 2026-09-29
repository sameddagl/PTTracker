import { FormSkeleton, HeaderSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back action={false} />
      <FormSkeleton />
    </LoadingScreen>
  );
}
