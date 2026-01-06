-- Migration: 20260106_add_persona_video_url.sql
-- Description: Adds video_url column to personas table for "Spark of Life" feature.

ALTER TABLE personas ADD COLUMN IF NOT EXISTS video_url TEXT;

-- We might also want a storage bucket for videos if not exists, but usually buckets are global.
-- Let's ensure 'chat_backgrounds' or a new 'persona_videos' bucket acts properly? 
-- For now, we'll assume we can upload to an existing bucket or create one via dashboard if needed.
-- But the robust way asked for an uploader.
-- Let's create a bucket entry in 'storage.buckets' if possible via SQL?
-- Supabase storage buckets are in storage schema.

INSERT INTO storage.buckets (id, name, public)
VALUES ('persona_videos', 'persona_videos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for public read of videos
CREATE POLICY "Public Access to Persona Videos"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'persona_videos' );

-- Policy for authenticated upload (e.g. creators or admins)
CREATE POLICY "Authenticated users can upload persona videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'persona_videos' );

-- Policy for update/delete (creators manage their own)
CREATE POLICY "Users can update their own persona videos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'persona_videos' AND owner = auth.uid() );

CREATE POLICY "Users can delete their own persona videos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'persona_videos' AND owner = auth.uid() );
