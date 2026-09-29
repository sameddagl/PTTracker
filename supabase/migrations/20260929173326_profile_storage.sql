-- Public bucket for trainer profile photos. Each trainer may only write under
-- a folder named after their user id: "<uid>/avatar-123.webp".
-- Skipped where Supabase Storage is absent (the PGlite test database).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    RETURN;
  END IF;

  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('profile', 'profile', true, 2097152, ARRAY['image/webp', 'image/jpeg', 'image/png'])
  ON CONFLICT (id) DO UPDATE
    SET public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

  EXECUTE $p$
    CREATE POLICY "profile_insert_own" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'profile' AND (storage.foldername(name))[1] = (select auth.uid())::text)
  $p$;
  EXECUTE $p$
    CREATE POLICY "profile_update_own" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'profile' AND (storage.foldername(name))[1] = (select auth.uid())::text)
  $p$;
  EXECUTE $p$
    CREATE POLICY "profile_delete_own" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'profile' AND (storage.foldername(name))[1] = (select auth.uid())::text)
  $p$;
END
$$;
