-- =====================================================
-- REMRIN.AI AUDIO STORAGE BUCKETS MIGRATION
-- =====================================================
-- Purpose: Create and configure storage buckets for audio system
-- Created: 2026-01-08
-- 
-- Buckets:
--   1. persona_audio - Welcome messages and persona audio files
--   2. audio_cache - TTS generated audio (temporary cache)
--   3. voice_samples - User-uploaded voice cloning samples
--
-- Features:
--   - Public READ access for all buckets
--   - Authenticated UPLOAD access
--   - Owner DELETE access
--   - 50MB file size limits
--   - MIME type restrictions for audio files
--   - Helper functions for URL generation and cache cleanup
-- =====================================================

-- =====================================================
-- BUCKET CREATION
-- =====================================================

-- Create persona_audio bucket for welcome messages
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'persona_audio',
  'persona_audio',
  true,
  52428800, -- 50MB in bytes
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3', 'audio/x-wav']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create audio_cache bucket for TTS generated audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio_cache',
  'audio_cache',
  true,
  52428800, -- 50MB in bytes
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3', 'audio/x-wav']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create voice_samples bucket for user-uploaded voice cloning samples
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice_samples',
  'voice_samples',
  true,
  52428800, -- 50MB in bytes
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3', 'audio/x-wav']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- RLS POLICIES - PERSONA_AUDIO BUCKET
-- =====================================================

-- Public READ access for persona_audio
DROP POLICY IF EXISTS "Public read access for persona_audio" ON storage.objects;
CREATE POLICY "Public read access for persona_audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'persona_audio');

-- Authenticated UPLOAD access for persona_audio
DROP POLICY IF EXISTS "Authenticated upload access for persona_audio" ON storage.objects;
CREATE POLICY "Authenticated upload access for persona_audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'persona_audio');

-- Owner DELETE access for persona_audio
DROP POLICY IF EXISTS "Owner delete access for persona_audio" ON storage.objects;
CREATE POLICY "Owner delete access for persona_audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'persona_audio' 
  AND auth.uid() = owner
);

-- Owner UPDATE access for persona_audio
DROP POLICY IF EXISTS "Owner update access for persona_audio" ON storage.objects;
CREATE POLICY "Owner update access for persona_audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'persona_audio' 
  AND auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'persona_audio' 
  AND auth.uid() = owner
);

-- =====================================================
-- RLS POLICIES - AUDIO_CACHE BUCKET
-- =====================================================

-- Public READ access for audio_cache
DROP POLICY IF EXISTS "Public read access for audio_cache" ON storage.objects;
CREATE POLICY "Public read access for audio_cache"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio_cache');

-- Authenticated UPLOAD access for audio_cache
DROP POLICY IF EXISTS "Authenticated upload access for audio_cache" ON storage.objects;
CREATE POLICY "Authenticated upload access for audio_cache"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio_cache');

-- Owner DELETE access for audio_cache
DROP POLICY IF EXISTS "Owner delete access for audio_cache" ON storage.objects;
CREATE POLICY "Owner delete access for audio_cache"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio_cache' 
  AND auth.uid() = owner
);

-- Owner UPDATE access for audio_cache
DROP POLICY IF EXISTS "Owner update access for audio_cache" ON storage.objects;
CREATE POLICY "Owner update access for audio_cache"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audio_cache' 
  AND auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'audio_cache' 
  AND auth.uid() = owner
);

-- =====================================================
-- RLS POLICIES - VOICE_SAMPLES BUCKET
-- =====================================================

-- Public READ access for voice_samples
DROP POLICY IF EXISTS "Public read access for voice_samples" ON storage.objects;
CREATE POLICY "Public read access for voice_samples"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice_samples');

-- Authenticated UPLOAD access for voice_samples
DROP POLICY IF EXISTS "Authenticated upload access for voice_samples" ON storage.objects;
CREATE POLICY "Authenticated upload access for voice_samples"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice_samples');

-- Owner DELETE access for voice_samples
DROP POLICY IF EXISTS "Owner delete access for voice_samples" ON storage.objects;
CREATE POLICY "Owner delete access for voice_samples"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice_samples' 
  AND auth.uid() = owner
);

-- Owner UPDATE access for voice_samples
DROP POLICY IF EXISTS "Owner update access for voice_samples" ON storage.objects;
CREATE POLICY "Owner update access for voice_samples"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'voice_samples' 
  AND auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'voice_samples' 
  AND auth.uid() = owner
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: get_audio_url
-- Purpose: Generate public URL for audio files
-- Usage: SELECT get_audio_url('persona_audio', 'welcome/persona_123.mp3');
CREATE OR REPLACE FUNCTION get_audio_url(
  bucket_name TEXT,
  file_path TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url TEXT;
  project_url TEXT;
BEGIN
  -- Get the Supabase project URL from settings
  -- Format: https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
  
  -- For local development, you might need to adjust this
  project_url := current_setting('app.settings.supabase_url', true);
  
  -- If not set, construct from request
  IF project_url IS NULL OR project_url = '' THEN
    project_url := current_setting('request.headers', true)::json->>'host';
    IF project_url IS NOT NULL THEN
      project_url := 'https://' || project_url;
    END IF;
  END IF;
  
  -- Fallback to a placeholder if still not found
  IF project_url IS NULL OR project_url = '' THEN
    project_url := 'https://your-project.supabase.co';
  END IF;
  
  -- Construct the full URL
  base_url := project_url || '/storage/v1/object/public/' || bucket_name || '/' || file_path;
  
  RETURN base_url;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION get_audio_url(TEXT, TEXT) IS 
'Generates a public URL for an audio file in a storage bucket. Returns the full HTTPS URL that can be used to access the file.';

-- Function: delete_old_cache
-- Purpose: Cleanup old cached audio files
-- Usage: SELECT delete_old_cache(7); -- Delete files older than 7 days
CREATE OR REPLACE FUNCTION delete_old_cache(
  days_old INTEGER DEFAULT 7
)
RETURNS TABLE(
  deleted_count INTEGER,
  freed_bytes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_freed_bytes BIGINT := 0;
  v_cutoff_date TIMESTAMPTZ;
  v_file RECORD;
BEGIN
  -- Calculate cutoff date
  v_cutoff_date := NOW() - (days_old || ' days')::INTERVAL;
  
  -- Find and delete old files from audio_cache bucket
  FOR v_file IN
    SELECT id, name, metadata->>'size' as file_size
    FROM storage.objects
    WHERE bucket_id = 'audio_cache'
      AND created_at < v_cutoff_date
  LOOP
    -- Accumulate size (convert to bigint, handle NULL)
    v_freed_bytes := v_freed_bytes + COALESCE(v_file.file_size::BIGINT, 0);
    
    -- Delete the file
    DELETE FROM storage.objects WHERE id = v_file.id;
    
    -- Increment counter
    v_deleted_count := v_deleted_count + 1;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT v_deleted_count, v_freed_bytes;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION delete_old_cache(INTEGER) IS 
'Deletes audio files from the audio_cache bucket that are older than the specified number of days. Returns the count of deleted files and total bytes freed.';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Create a view for easy bucket verification
CREATE OR REPLACE VIEW audio_bucket_status AS
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
WHERE id IN ('persona_audio', 'audio_cache', 'voice_samples')
ORDER BY id;

COMMENT ON VIEW audio_bucket_status IS 
'View showing configuration status of all audio storage buckets';

-- Create a view for bucket usage statistics
CREATE OR REPLACE VIEW audio_bucket_stats AS
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(COALESCE((metadata->>'size')::BIGINT, 0)) as total_bytes,
  SUM(COALESCE((metadata->>'size')::BIGINT, 0)) / 1048576 as total_mb,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM storage.objects
WHERE bucket_id IN ('persona_audio', 'audio_cache', 'voice_samples')
GROUP BY bucket_id
ORDER BY bucket_id;

COMMENT ON VIEW audio_bucket_stats IS 
'View showing usage statistics for all audio storage buckets';

-- =====================================================
-- BUCKET CONFIGURATION DOCUMENTATION
-- =====================================================

/*
AUDIO STORAGE BUCKETS CONFIGURATION
====================================

BUCKET: persona_audio
---------------------
Purpose: Store welcome messages and persona-specific audio files
Access: 
  - READ: Public (anyone can download)
  - UPLOAD: Authenticated users only
  - DELETE: File owner only
  - UPDATE: File owner only
Size Limit: 50MB per file
MIME Types: audio/mpeg, audio/wav, audio/ogg, audio/webm, audio/mp3, audio/x-wav
Typical Usage: 
  - Persona welcome messages
  - Custom persona voice recordings
  - Persona audio branding

BUCKET: audio_cache
-------------------
Purpose: Temporary storage for TTS-generated audio files
Access: 
  - READ: Public (anyone can download)
  - UPLOAD: Authenticated users only
  - DELETE: File owner only
  - UPDATE: File owner only
Size Limit: 50MB per file
MIME Types: audio/mpeg, audio/wav, audio/ogg, audio/webm, audio/mp3, audio/x-wav
Typical Usage:
  - Cached TTS responses
  - Temporary audio generation
  - Session-based audio files
Cleanup: Use delete_old_cache() function to remove old files

BUCKET: voice_samples
---------------------
Purpose: Store user-uploaded voice samples for voice cloning
Access: 
  - READ: Public (anyone can download)
  - UPLOAD: Authenticated users only
  - DELETE: File owner only
  - UPDATE: File owner only
Size Limit: 50MB per file
MIME Types: audio/mpeg, audio/wav, audio/ogg, audio/webm, audio/mp3, audio/x-wav
Typical Usage:
  - User voice samples for cloning
  - Reference audio for TTS training
  - Custom voice profiles

HELPER FUNCTIONS
================

1. get_audio_url(bucket_name, file_path)
   Returns: Public URL for the audio file
   Example: SELECT get_audio_url('persona_audio', 'welcome/persona_123.mp3');
   
2. delete_old_cache(days_old)
   Returns: {deleted_count, freed_bytes}
   Example: SELECT * FROM delete_old_cache(7); -- Delete files older than 7 days
   
VERIFICATION QUERIES
====================

-- Check bucket configuration
SELECT * FROM audio_bucket_status;

-- Check bucket usage
SELECT * FROM audio_bucket_stats;

-- List all policies for audio buckets
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%persona_audio%'
     OR policyname LIKE '%audio_cache%'
     OR policyname LIKE '%voice_samples%'
ORDER BY policyname;

-- Test file upload (from application code)
-- Example using Supabase JS client:
-- const { data, error } = await supabase.storage
--   .from('persona_audio')
--   .upload('welcome/test.mp3', audioFile);

-- Test file download URL generation
-- SELECT get_audio_url('persona_audio', 'welcome/test.mp3');

-- Test cache cleanup
-- SELECT * FROM delete_old_cache(7);

MAINTENANCE
===========

Recommended maintenance tasks:

1. Weekly cache cleanup:
   SELECT * FROM delete_old_cache(7);

2. Monthly usage review:
   SELECT * FROM audio_bucket_stats;

3. Quarterly policy audit:
   SELECT * FROM pg_policies WHERE tablename = 'objects';

SECURITY NOTES
==============

- All buckets are PUBLIC for READ access (required for audio playback)
- Only authenticated users can upload files
- Users can only delete/update their own files
- File size is limited to 50MB to prevent abuse
- MIME types are restricted to audio formats only
- RLS policies enforce ownership checks

*/

-- =====================================================
-- CLEANUP SCRIPT FOR OLD CACHED AUDIO
-- =====================================================

-- This script can be run manually or scheduled via pg_cron
-- To schedule automatic cleanup (requires pg_cron extension):
-- 
-- SELECT cron.schedule(
--   'cleanup-audio-cache',
--   '0 2 * * *', -- Run at 2 AM daily
--   $$ SELECT delete_old_cache(7); $$
-- );

-- Manual cleanup example:
-- SELECT * FROM delete_old_cache(7); -- Delete files older than 7 days

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================

/*
-- To rollback this migration, run:

-- Drop views
DROP VIEW IF EXISTS audio_bucket_stats;
DROP VIEW IF EXISTS audio_bucket_status;

-- Drop functions
DROP FUNCTION IF EXISTS delete_old_cache(INTEGER);
DROP FUNCTION IF EXISTS get_audio_url(TEXT, TEXT);

-- Drop policies for persona_audio
DROP POLICY IF EXISTS "Owner update access for persona_audio" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete access for persona_audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access for persona_audio" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for persona_audio" ON storage.objects;

-- Drop policies for audio_cache
DROP POLICY IF EXISTS "Owner update access for audio_cache" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete access for audio_cache" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access for audio_cache" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for audio_cache" ON storage.objects;

-- Drop policies for voice_samples
DROP POLICY IF EXISTS "Owner update access for voice_samples" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete access for voice_samples" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access for voice_samples" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for voice_samples" ON storage.objects;

-- Delete buckets
DELETE FROM storage.buckets WHERE id IN ('persona_audio', 'audio_cache', 'voice_samples');

*/
