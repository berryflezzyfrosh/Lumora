/*
# Allow common image uploads in the private studio media bucket.

Existing deployments may already have applied the original bucket migration, so
update the bucket MIME allow-list without changing its privacy or size limit.
*/

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/ogg'
]
WHERE id = 'studio-media';
