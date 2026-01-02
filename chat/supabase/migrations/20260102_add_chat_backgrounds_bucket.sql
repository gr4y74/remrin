-- Create chat_backgrounds storage bucket and policies
-- Run this in Supabase SQL Editor

-- Step 1: Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat_backgrounds',
    'chat_backgrounds',
    false,
    52428800,  -- 50MB limit (for premium video backgrounds)
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update backgrounds" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete backgrounds" ON storage.objects;

-- Step 3: Create policies for authenticated users
-- INSERT: Allow any authenticated user to upload to the bucket
CREATE POLICY "Authenticated users can upload backgrounds" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat_backgrounds');

-- SELECT: Allow any authenticated user to read from the bucket
CREATE POLICY "Authenticated users can read backgrounds" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'chat_backgrounds');

-- UPDATE: Allow any authenticated user to update in the bucket  
CREATE POLICY "Authenticated users can update backgrounds" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'chat_backgrounds');

-- DELETE: Allow any authenticated user to delete from the bucket
CREATE POLICY "Authenticated users can delete backgrounds" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'chat_backgrounds');

-- Verify: Check that the bucket was created/updated
SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'chat_backgrounds';
