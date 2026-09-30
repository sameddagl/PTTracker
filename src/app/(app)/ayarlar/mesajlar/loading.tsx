import { FormSkeleton, HeaderSkeleton, LoadingScreen } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Hatırlatma ve mesajlar" action={false} />
      <FormSkeleton fields={4} />
    </LoadingScreen>
  );
}
