-- Migration: 20260120_fix_social_relationships.sql
-- Description: Establish foreign key relationships between posts/comments and user_profiles

-- 1. Fix 'posts' relationship to 'user_profiles'
-- First, ensure the constraint name is consistent
ALTER TABLE posts
DROP CONSTRAINT IF EXISTS posts_user_id_fkey_user_profiles;

ALTER TABLE posts
ADD CONSTRAINT posts_user_id_fkey_user_profiles
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- 2. Fix 'post_comments' relationship to 'user_profiles'
ALTER TABLE post_comments
DROP CONSTRAINT IF EXISTS post_comments_user_id_fkey_user_profiles;

ALTER TABLE post_comments
ADD CONSTRAINT post_comments_user_id_fkey_user_profiles
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- 3. Fix 'post_reactions' relationship to 'user_profiles'
ALTER TABLE post_reactions
DROP CONSTRAINT IF EXISTS post_reactions_user_id_fkey_user_profiles;

ALTER TABLE post_reactions
ADD CONSTRAINT post_reactions_user_id_fkey_user_profiles
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- 4. Fix 'post_comment_likes' relationship to 'user_profiles'
ALTER TABLE post_comment_likes
DROP CONSTRAINT IF EXISTS post_comment_likes_user_id_fkey_user_profiles;

ALTER TABLE post_comment_likes
ADD CONSTRAINT post_comment_likes_user_id_fkey_user_profiles
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- 5. Ensure RLS is updated for these relationships (Select)
-- This mainly helps Supabase auto-join logic in the schema cache
COMMENT ON CONSTRAINT posts_user_id_fkey_user_profiles ON posts IS 'Relates post author to their extended profile';
COMMENT ON CONSTRAINT post_comments_user_id_fkey_user_profiles ON post_comments IS 'Relates comment author to their extended profile';
