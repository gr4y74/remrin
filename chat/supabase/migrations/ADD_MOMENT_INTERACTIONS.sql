-- Migration to add Feed/TikTok style interactions
-- Run this in Supabase SQL Editor

-- 1. Create Comment Table for Moments
CREATE TABLE IF NOT EXISTS moment_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Bookmark Table
CREATE TABLE IF NOT EXISTS moment_bookmarks (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, moment_id)
);

-- 3. Create Share Tracking Table
CREATE TABLE IF NOT EXISTS moment_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    platform TEXT, -- e.g., 'copy_link', 'twitter', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE moment_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_shares ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Comments
CREATE POLICY "Public read comments" ON moment_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can comment" ON moment_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON moment_comments FOR DELETE USING (auth.uid() = user_id);
-- Also allow moment owner to delete comments?
CREATE POLICY "Moment owner delete comments" ON moment_comments FOR DELETE USING (
  EXISTS (SELECT 1 FROM moments WHERE id = moment_comments.moment_id AND created_by_user_id = auth.uid())
);

-- Bookmarks
CREATE POLICY "Auth users can bookmark" ON moment_bookmarks FOR ALL USING (auth.uid() = user_id);
-- (Using ALL for select/insert/delete since it's a join table for own use)

-- Shares
CREATE POLICY "Auth users can share" ON moment_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read shares" ON moment_shares FOR SELECT USING (true);


-- 6. Add Computed Columns / Cache Counts to Moments Table
-- We'll add columns if they don't exist
ALTER TABLE moments ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS bookmarks_count INTEGER DEFAULT 0;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- 7. Triggers for Counts
-- Function to update moment counts
CREATE OR REPLACE FUNCTION update_moment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (TG_TABLE_NAME = 'moment_comments') THEN
            UPDATE moments SET comments_count = comments_count + 1 WHERE id = NEW.moment_id;
        ELSIF (TG_TABLE_NAME = 'moment_bookmarks') THEN
            UPDATE moments SET bookmarks_count = bookmarks_count + 1 WHERE id = NEW.moment_id;
        ELSIF (TG_TABLE_NAME = 'moment_shares') THEN
            UPDATE moments SET shares_count = shares_count + 1 WHERE id = NEW.moment_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (TG_TABLE_NAME = 'moment_comments') THEN
             UPDATE moments SET comments_count = comments_count - 1 WHERE id = OLD.moment_id;
        ELSIF (TG_TABLE_NAME = 'moment_bookmarks') THEN
             UPDATE moments SET bookmarks_count = bookmarks_count - 1 WHERE id = OLD.moment_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS update_moment_comments_count ON moment_comments;
CREATE TRIGGER update_moment_comments_count
AFTER INSERT OR DELETE ON moment_comments
FOR EACH ROW EXECUTE FUNCTION update_moment_counts();

DROP TRIGGER IF EXISTS update_moment_bookmarks_count ON moment_bookmarks;
CREATE TRIGGER update_moment_bookmarks_count
AFTER INSERT OR DELETE ON moment_bookmarks
FOR EACH ROW EXECUTE FUNCTION update_moment_counts();

DROP TRIGGER IF EXISTS update_moment_shares_count ON moment_shares;
CREATE TRIGGER update_moment_shares_count
AFTER INSERT ON moment_shares
FOR EACH ROW EXECUTE FUNCTION update_moment_counts();

-- 8. Fix Realtime Replication
-- To allow client to listen to INSERTs on comments
ALTER PUBLICATION supabase_realtime ADD TABLE moment_comments;

