/*
# Create private studio media bucket

1. New Storage
- `studio-media` bucket: private (not publicly readable), 500 MB per file limit, supported image, video and audio MIME types only.
- Files are stored under `<user id>/<project id>/<file name>`.

2. Security
- Row level security on storage objects is already enabled by the platform.
- Authenticated users can read, upload, update and delete only objects inside their own user-id folder.
- Anonymous users have no access to the bucket.

3. Notes
- Playback uses short-lived signed URLs created by the app, so media is never publicly listed.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'studio-media',
  'studio-media',
  false,
  524288000,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

DROP POLICY IF EXISTS "studio_media_select_own" ON storage.objects;
CREATE POLICY "studio_media_select_own" ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'studio-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "studio_media_insert_own" ON storage.objects;
CREATE POLICY "studio_media_insert_own" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'studio-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "studio_media_update_own" ON storage.objects;
CREATE POLICY "studio_media_update_own" ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'studio-media' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'studio-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "studio_media_delete_own" ON storage.objects;
CREATE POLICY "studio_media_delete_own" ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'studio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
