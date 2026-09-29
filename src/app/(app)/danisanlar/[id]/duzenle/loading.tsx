import { FormSkeleton, HeaderSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Danışanı düzenle" action={false} />
      <FormSkeleton />
    </LoadingScreen>
  );
}
