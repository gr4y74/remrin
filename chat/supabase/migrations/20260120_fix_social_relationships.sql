-- Migration: 20260120_fix_social_relationships.sql
-- Description: Establish foreign key relationships between posts/comments and user_profiles

-- 1. Fix 'posts' relationship to 'user_profiles'
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

-- 4. Create 'post_comment_likes' table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 5. Add 'post_comment_likes' relationship to 'user_profiles'
ALTER TABLE post_comment_likes
DROP CONSTRAINT IF EXISTS post_comment_likes_user_id_fkey_user_profiles;

ALTER TABLE post_comment_likes
ADD CONSTRAINT post_comment_likes_user_id_fkey_user_profiles
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- 6. Enable RLS on post_comment_likes
ALTER TABLE post_comment_likes ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for post_comment_likes
DROP POLICY IF EXISTS "Users can view all comment likes" ON post_comment_likes;
CREATE POLICY "Users can view all comment likes" ON post_comment_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like comments" ON post_comment_likes;
CREATE POLICY "Users can like comments" ON post_comment_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike their own likes" ON post_comment_likes;
CREATE POLICY "Users can unlike their own likes" ON post_comment_likes
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Add comments to help Supabase identify relationships
COMMENT ON CONSTRAINT posts_user_id_fkey_user_profiles ON posts IS 'Relates post author to their extended profile';
COMMENT ON CONSTRAINT post_comments_user_id_fkey_user_profiles ON post_comments IS 'Relates comment author to their extended profile';
