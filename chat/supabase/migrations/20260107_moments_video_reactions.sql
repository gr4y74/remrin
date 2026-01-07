-- Add video support to moments table
ALTER TABLE moments 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create reactions table
CREATE TABLE IF NOT EXISTS moment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(moment_id, user_id, reaction_emoji)
);

-- Add reaction counts to moments (denormalized for performance)
ALTER TABLE moments
ADD COLUMN IF NOT EXISTS reactions_summary JSONB DEFAULT '{}';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moment_reactions_moment_id ON moment_reactions(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_reactions_user_id ON moment_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_media_type ON moments(media_type);
CREATE INDEX IF NOT EXISTS idx_moments_created_by_user ON moments(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_moments_view_count ON moments(view_count DESC);

-- RLS Policies for reactions
ALTER TABLE moment_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view reactions
CREATE POLICY "Anyone can view reactions"
ON moment_reactions FOR SELECT
USING (true);

-- Authenticated users can add reactions
CREATE POLICY "Authenticated users can add reactions"
ON moment_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON moment_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION update_moment_reactions_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate reactions summary for the affected moment
    UPDATE moments
    SET reactions_summary = (
        SELECT jsonb_object_agg(reaction_emoji, count)
        FROM (
            SELECT reaction_emoji, COUNT(*)::int as count
            FROM moment_reactions
            WHERE moment_id = COALESCE(NEW.moment_id, OLD.moment_id)
            GROUP BY reaction_emoji
        ) reactions
    )
    WHERE id = COALESCE(NEW.moment_id, OLD.moment_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update reaction counts
DROP TRIGGER IF EXISTS trigger_update_moment_reactions ON moment_reactions;
CREATE TRIGGER trigger_update_moment_reactions
AFTER INSERT OR DELETE ON moment_reactions
FOR EACH ROW
EXECUTE FUNCTION update_moment_reactions_summary();

-- Update existing moments to have empty reactions_summary
UPDATE moments SET reactions_summary = '{}' WHERE reactions_summary IS NULL;

COMMENT ON TABLE moment_reactions IS 'Emoji reactions on moments (like Discord reactions)';
COMMENT ON COLUMN moments.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN moments.video_url IS 'URL to video file in storage';
COMMENT ON COLUMN moments.thumbnail_url IS 'URL to video thumbnail image';
COMMENT ON COLUMN moments.duration_seconds IS 'Video duration in seconds';
COMMENT ON COLUMN moments.reactions_summary IS 'Denormalized reaction counts as JSON {emoji: count}';
