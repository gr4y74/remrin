-- FIX: Add Foreign Key for Comments to Profiles (Idempotent Version)
-- Run this in Supabase SQL Editor

-- 1. DROP existing constraints to avoid "already exists" errors
ALTER TABLE moment_comments
DROP CONSTRAINT IF EXISTS moment_comments_user_id_fkey_real_profiles;

ALTER TABLE moment_bookmarks
DROP CONSTRAINT IF EXISTS moment_bookmarks_user_id_fkey_real_profiles;

ALTER TABLE moment_shares
DROP CONSTRAINT IF EXISTS moment_shares_user_id_fkey_real_profiles;

-- 2. Add the correct constraints linking to 'profiles' table
-- Ensure profiles.user_id is unique/PK.
ALTER TABLE moment_comments
ADD CONSTRAINT moment_comments_user_id_fkey_real_profiles
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE moment_bookmarks
ADD CONSTRAINT moment_bookmarks_user_id_fkey_real_profiles
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE moment_shares
ADD CONSTRAINT moment_shares_user_id_fkey_real_profiles
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
