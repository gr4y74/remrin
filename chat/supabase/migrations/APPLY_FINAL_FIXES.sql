-- Final Fixes for Notifications and Storage (Idempotent Version)
-- Run this in Supabase SQL Editor

-- ==========================================================
-- PART 1: Fix Notification Relationships (Solve 400 Errors)
-- ==========================================================

-- We need explicit FKs to user_profiles for the frontend queries to work via relations

-- user_subscribers
ALTER TABLE user_subscribers 
DROP CONSTRAINT IF EXISTS user_subscribers_subscriber_id_fkey_profiles, -- cleanup if exists
ADD CONSTRAINT user_subscribers_subscriber_id_fkey_profiles
FOREIGN KEY (subscriber_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE user_subscribers 
DROP CONSTRAINT IF EXISTS user_subscribers_subscribed_to_id_fkey_profiles,
ADD CONSTRAINT user_subscribers_subscribed_to_id_fkey_profiles
FOREIGN KEY (subscribed_to_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- user_connections
ALTER TABLE user_connections
DROP CONSTRAINT IF EXISTS user_connections_user_id_fkey_profiles,
ADD CONSTRAINT user_connections_user_id_fkey_profiles
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE user_connections
DROP CONSTRAINT IF EXISTS user_connections_connected_to_id_fkey_profiles,
ADD CONSTRAINT user_connections_connected_to_id_fkey_profiles
FOREIGN KEY (connected_to_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- content_likes
ALTER TABLE content_likes
DROP CONSTRAINT IF EXISTS content_likes_user_id_fkey_profiles,
ADD CONSTRAINT content_likes_user_id_fkey_profiles
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- content_comments
ALTER TABLE content_comments
DROP CONSTRAINT IF EXISTS content_comments_user_id_fkey_profiles,
ADD CONSTRAINT content_comments_user_id_fkey_profiles
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;


-- ==========================================================
-- PART 2: Storage Policies (Ensure Uploads Work)
-- ==========================================================

-- Drop policies if they exist (to fix "already exists" error)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01k_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01k_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01k_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01k_3" ON storage.objects;

-- Re-create policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('moment-images', 'moment-videos', 'moment-thumbnails') );

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('moment-images', 'moment-videos', 'moment-thumbnails')
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('moment-images', 'moment-videos', 'moment-thumbnails')
  AND auth.uid() = owner
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('moment-images', 'moment-videos', 'moment-thumbnails')
  AND auth.uid() = owner
);
