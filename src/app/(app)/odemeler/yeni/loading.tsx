import { FormSkeleton, HeaderSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Ödeme al" action={false} />
      <FormSkeleton />
    </LoadingScreen>
  );
}
