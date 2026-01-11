-- Add direct foreign key from posts/engagement to user_profiles for easier Supabase JOINs
-- and ensure columns match the Social Network architecture

-- 1. Fix posts to point to user_profiles directly
ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS posts_user_id_fkey,
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(user_id) 
ON DELETE CASCADE;

-- 2. Fix post_reactions
ALTER TABLE post_reactions
DROP CONSTRAINT IF EXISTS post_reactions_user_id_fkey,
ADD CONSTRAINT post_reactions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES user_profiles(user_id)
ON DELETE CASCADE;

-- 3. Fix post_comments
ALTER TABLE post_comments
DROP CONSTRAINT IF EXISTS post_comments_user_id_fkey,
ADD CONSTRAINT post_comments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES user_profiles(user_id)
ON DELETE CASCADE;

-- 4. Fix post_shares
ALTER TABLE post_shares
DROP CONSTRAINT IF EXISTS post_shares_user_id_fkey,
ADD CONSTRAINT post_shares_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES user_profiles(user_id)
ON DELETE CASCADE;

-- 5. Ensure Storage Buckets exist (Manual step note)
-- Ensure 'avatars' bucket exists in Supabase Storage with public access.
