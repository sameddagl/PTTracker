import { FormSkeleton, HeaderSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Geç iptal kuralı" action={false} />
      <FormSkeleton fields={1} />
    </LoadingScreen>
  );
}
