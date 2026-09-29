export const PROFILE_BUCKET = "profile";

/** Public URL of an object in the profile bucket. */
export const profileImageUrl = (path: string | null | undefined) =>
  path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PROFILE_BUCKET}/${path}` : null;
