import { FormSkeleton, HeaderSkeleton, ListSkeleton, LoadingScreen, SectionTitleSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingScreen>
      <HeaderSkeleton back title="Ekip" action={false} />
      <SectionTitleSkeleton />
      <ListSkeleton rows={3} />
      <FormSkeleton fields={3} />
    </LoadingScreen>
  );
}
