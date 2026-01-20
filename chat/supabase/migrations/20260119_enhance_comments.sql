-- Migration: 20260119_enhance_comments.sql
-- Description: Add comment likes and update comment depth limit to 2 levels

-- 1. Create post_comment_likes table
CREATE TABLE IF NOT EXISTS post_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE post_comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view comment likes" ON post_comment_likes;
CREATE POLICY "Anyone can view comment likes" ON post_comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like comments" ON post_comment_likes;
CREATE POLICY "Users can like comments" ON post_comment_likes FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can unlike comments" ON post_comment_likes;
CREATE POLICY "Users can unlike comments" ON post_comment_likes FOR DELETE USING (user_id = auth.uid());

-- 2. Update comment depth trigger to 2 levels
CREATE OR REPLACE FUNCTION check_comment_depth()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_comment_id IS NOT NULL THEN
        -- Check if the parent of the new comment itself has a parent who also has a parent
        -- NEW (Level 3) -> Parent (Level 2) -> Grandparent (Level 1) -> Great-grandparent (Level 0)
        IF EXISTS (
            SELECT 1 
            FROM post_comments p1
            JOIN post_comments p2 ON p1.parent_comment_id = p2.id
            WHERE p1.id = NEW.parent_comment_id
            AND p2.parent_comment_id IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'Nesting level exceeded: Comments only support two levels of replies.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-apply trigger (should be already there, but just in case)
DROP TRIGGER IF EXISTS tr_check_comment_depth ON post_comments;
CREATE TRIGGER tr_check_comment_depth
BEFORE INSERT OR UPDATE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION check_comment_depth();

COMMENT ON TABLE post_comments IS 'Comments on posts with 2nd-level nested replies';
