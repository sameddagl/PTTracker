-- Let a trainer list their own profile photos, so the app can remove them all
-- when the account is deleted (Storage's remove() needs SELECT as well as DELETE).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    RETURN;
  END IF;
  EXECUTE $p$
    CREATE POLICY "profile_select_own" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'profile' AND (storage.foldername(name))[1] = (select auth.uid())::text)
  $p$;
END
$$;
