import { FormSkeleton, HeaderSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Eğitmen" action={false} />
      <FormSkeleton fields={3} />
    </LoadingScreen>
  );
}
