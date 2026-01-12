-- ============================================
-- Supabase Storage Bucket Setup for Post Media
-- ============================================
-- Run this in your Supabase SQL Editor

-- Step 1: Create the post-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own post media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post media" ON storage.objects;

-- Step 3: RLS policy to allow authenticated users to upload their own media
CREATE POLICY "Users can upload their own post media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'post-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 4: RLS policy to allow public read access
CREATE POLICY "Public can view post media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-media');

-- Step 5: RLS policy to allow users to delete their own media
CREATE POLICY "Users can delete their own post media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'post-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 6: RLS policy to allow users to update their own media
CREATE POLICY "Users can update their own post media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'post-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verification query - run this to confirm bucket was created
SELECT * FROM storage.buckets WHERE id = 'post-media';
