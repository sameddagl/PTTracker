import { FormSkeleton, HeaderSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Kayıt bilgileri" action={false} />
      <FormSkeleton fields={6} />
    </LoadingScreen>
  );
}
