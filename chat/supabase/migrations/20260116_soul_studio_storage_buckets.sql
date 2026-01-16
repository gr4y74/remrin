-- ============================================================================
-- SOUL STUDIO STORAGE BUCKETS MIGRATION
-- Migration: 20260116_soul_studio_storage_buckets
-- Description: Create storage buckets for Soul Studio (avatars, heroes, audio, video)
-- Created: 2026-01-16
-- ============================================================================

-- ============================================================================
-- BUCKET: soul_forge (Images - Avatars & Hero Backgrounds)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'soul_forge',
    'soul_forge',
    true,
    10485760, -- 10MB for images
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public READ access
DROP POLICY IF EXISTS "Public read access for soul_forge" ON storage.objects;
CREATE POLICY "Public read access for soul_forge"
ON storage.objects FOR SELECT
USING (bucket_id = 'soul_forge');

-- Authenticated UPLOAD access
DROP POLICY IF EXISTS "Authenticated upload access for soul_forge" ON storage.objects;
CREATE POLICY "Authenticated upload access for soul_forge"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'soul_forge');

-- Owner DELETE access
DROP POLICY IF EXISTS "Owner delete access for soul_forge" ON storage.objects;
CREATE POLICY "Owner delete access for soul_forge"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'soul_forge' 
    AND auth.uid() = owner
);

-- Owner UPDATE access
DROP POLICY IF EXISTS "Owner update access for soul_forge" ON storage.objects;
CREATE POLICY "Owner update access for soul_forge"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'soul_forge' 
    AND auth.uid() = owner
)
WITH CHECK (
    bucket_id = 'soul_forge' 
    AND auth.uid() = owner
);

-- ============================================================================
-- BUCKET: soul_audio (Audio Samples - Voice Samples)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'soul_audio',
    'soul_audio',
    true,
    104857600, -- 100MB for audio
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-wav', 'audio/m4a']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public READ access
DROP POLICY IF EXISTS "Public read access for soul_audio" ON storage.objects;
CREATE POLICY "Public read access for soul_audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'soul_audio');

-- Authenticated UPLOAD access
DROP POLICY IF EXISTS "Authenticated upload access for soul_audio" ON storage.objects;
CREATE POLICY "Authenticated upload access for soul_audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'soul_audio');

-- Owner DELETE access
DROP POLICY IF EXISTS "Owner delete access for soul_audio" ON storage.objects;
CREATE POLICY "Owner delete access for soul_audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'soul_audio' 
    AND auth.uid() = owner
);

-- Owner UPDATE access
DROP POLICY IF EXISTS "Owner update access for soul_audio" ON storage.objects;
CREATE POLICY "Owner update access for soul_audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'soul_audio' 
    AND auth.uid() = owner
)
WITH CHECK (
    bucket_id = 'soul_audio' 
    AND auth.uid() = owner
);

-- ============================================================================
-- BUCKET: soul_video (Video Samples - Hero Videos)
-- ============================================================================
-- Size cap: 100MB (generous limit for high quality clips)
-- For reference:
--   - 10 sec 720p @ 2Mbps = ~2.5MB
--   - 15 sec 720p @ 2Mbps = ~3.75MB
--   - 15 sec 1080p @ 5Mbps = ~9.4MB
--   - 30 sec 1080p @ 8Mbps = ~30MB
--   - 100MB allows for longer or higher quality clips

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'soul_video',
    'soul_video',
    true,
    104857600, -- 100MB for video
    ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public READ access
DROP POLICY IF EXISTS "Public read access for soul_video" ON storage.objects;
CREATE POLICY "Public read access for soul_video"
ON storage.objects FOR SELECT
USING (bucket_id = 'soul_video');

-- Authenticated UPLOAD access
DROP POLICY IF EXISTS "Authenticated upload access for soul_video" ON storage.objects;
CREATE POLICY "Authenticated upload access for soul_video"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'soul_video');

-- Owner DELETE access
DROP POLICY IF EXISTS "Owner delete access for soul_video" ON storage.objects;
CREATE POLICY "Owner delete access for soul_video"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'soul_video' 
    AND auth.uid() = owner
);

-- Owner UPDATE access
DROP POLICY IF EXISTS "Owner update access for soul_video" ON storage.objects;
CREATE POLICY "Owner update access for soul_video"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'soul_video' 
    AND auth.uid() = owner
)
WITH CHECK (
    bucket_id = 'soul_video' 
    AND auth.uid() = owner
);

-- ============================================================================
-- VERIFICATION VIEW
-- ============================================================================

CREATE OR REPLACE VIEW soul_studio_bucket_status AS
SELECT 
    id,
    name,
    public,
    file_size_limit,
    file_size_limit / 1048576 as size_limit_mb,
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets
WHERE id IN ('soul_forge', 'soul_audio', 'soul_video')
ORDER BY id;

COMMENT ON VIEW soul_studio_bucket_status IS 
'View showing configuration status of Soul Studio storage buckets';

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

/*
SOUL STUDIO STORAGE BUCKETS
============================

BUCKET: soul_forge
------------------
Purpose: Store Soul avatars and hero background images
Size Limit: 10MB per file
MIME Types: image/jpeg, image/jpg, image/png, image/gif, image/webp, image/svg+xml
Usage:
  - Soul avatar images (avatars/)
  - Hero background images (heroes/)

BUCKET: soul_audio
------------------
Purpose: Store voice samples for Souls
Size Limit: 100MB per file
MIME Types: audio/mpeg, audio/mp3, audio/wav, audio/ogg, audio/webm, audio/x-wav, audio/m4a
Usage:
  - Voice samples for preview (samples/)
  - Audio clips for character personality

BUCKET: soul_video
------------------
Purpose: Store hero video backgrounds
Size Limit: 100MB per file
MIME Types: video/mp4, video/webm, video/ogg, video/quicktime, video/x-msvideo
Usage:
  - Hero background videos (heroes/)
  - Short promotional clips

VIDEO SIZE REFERENCE:
- 10 sec 720p @ 2Mbps = ~2.5MB
- 15 sec 720p @ 2Mbps = ~3.75MB
- 15 sec 1080p @ 5Mbps = ~9.4MB
- 30 sec 1080p @ 8Mbps = ~30MB
- 100MB allows for longer or higher quality clips

VERIFICATION:
SELECT * FROM soul_studio_bucket_status;
*/
