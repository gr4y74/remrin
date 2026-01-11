-- ============================================================================
-- STORAGE BUCKETS FOR SOCIAL FEATURES
-- Migration: 20260111_storage_buckets
-- Description: Create storage buckets for avatars, banners, and backgrounds
-- ============================================================================

-- Create avatars bucket (public read, authenticated write to own folder)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create profile_banners bucket (public read, authenticated write to own folder)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile_banners',
    'profile_banners',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create user_backgrounds bucket (public read, authenticated write to own folder)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user_backgrounds',
    'user_backgrounds',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES - AVATARS
-- ============================================================================

-- Allow public read access on avatars
CREATE POLICY "Public read access on avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Authenticated users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Authenticated users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- STORAGE POLICIES - PROFILE BANNERS
-- ============================================================================

-- Allow public read access on profile banners
CREATE POLICY "Public read access on profile banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_banners');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload own banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile_banners' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own banners
CREATE POLICY "Authenticated users can update own banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profile_banners' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own banners
CREATE POLICY "Authenticated users can delete own banners"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profile_banners' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- STORAGE POLICIES - USER BACKGROUNDS
-- ============================================================================

-- Allow public read access on user backgrounds
CREATE POLICY "Public read access on user backgrounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'user_backgrounds');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload own backgrounds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'user_backgrounds' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own backgrounds
CREATE POLICY "Authenticated users can update own backgrounds"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'user_backgrounds' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own backgrounds
CREATE POLICY "Authenticated users can delete own backgrounds"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'user_backgrounds' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
