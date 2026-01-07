-- Script to apply feed feature migrations and set user premium
-- Run this in Supabase SQL Editor

-- ============================================
-- PART 1: Add video support to moments table
-- ============================================
ALTER TABLE moments 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image',
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add check constraint separately (IF NOT EXISTS doesn't work for constraints)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'moments_media_type_check'
    ) THEN
        ALTER TABLE moments ADD CONSTRAINT moments_media_type_check CHECK (media_type IN ('image', 'video'));
    END IF;
END $$;

-- ============================================
-- PART 2: Create reactions table
-- ============================================
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

-- ============================================
-- PART 3: Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_moment_reactions_moment_id ON moment_reactions(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_reactions_user_id ON moment_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_media_type ON moments(media_type);
CREATE INDEX IF NOT EXISTS idx_moments_created_by_user ON moments(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_moments_view_count ON moments(view_count DESC);

-- ============================================
-- PART 4: RLS Policies for reactions
-- ============================================
ALTER TABLE moment_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view reactions" ON moment_reactions;
DROP POLICY IF EXISTS "Authenticated users can add reactions" ON moment_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON moment_reactions;

-- Create policies
CREATE POLICY "Anyone can view reactions"
ON moment_reactions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add reactions"
ON moment_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
ON moment_reactions FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- PART 5: Function and trigger for reaction counts
-- ============================================
CREATE OR REPLACE FUNCTION update_moment_reactions_summary()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE moments
    SET reactions_summary = COALESCE((
        SELECT jsonb_object_agg(reaction_emoji, count)
        FROM (
            SELECT reaction_emoji, COUNT(*)::int as count
            FROM moment_reactions
            WHERE moment_id = COALESCE(NEW.moment_id, OLD.moment_id)
            GROUP BY reaction_emoji
        ) reactions
    ), '{}'::jsonb)
    WHERE id = COALESCE(NEW.moment_id, OLD.moment_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_moment_reactions ON moment_reactions;
CREATE TRIGGER trigger_update_moment_reactions
AFTER INSERT OR DELETE ON moment_reactions
FOR EACH ROW
EXECUTE FUNCTION update_moment_reactions_summary();

-- Update existing moments
UPDATE moments SET reactions_summary = '{}' WHERE reactions_summary IS NULL;

-- ============================================
-- PART 6: View increment function
-- ============================================
CREATE OR REPLACE FUNCTION increment_moment_views(moment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE moments
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = moment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 7: Storage buckets for videos
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'moment-videos',
    'moment-videos',
    true,
    524288000,
    ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'moment-thumbnails',
    'moment-thumbnails',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 8: Set user ac5edd6c-7dcc-465a-bd8f-d4a5d592589d as premium (soul_weaver tier)
-- ============================================
INSERT INTO wallets (user_id, tier, balance_brain, created_at)
VALUES (
    'ac5edd6c-7dcc-465a-bd8f-d4a5d592589d'::uuid,
    'soul_weaver',
    5000,
    NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET tier = 'soul_weaver', balance_brain = GREATEST(wallets.balance_brain, 5000);

-- Verify the update
SELECT user_id, tier, balance_brain FROM wallets WHERE user_id = 'ac5edd6c-7dcc-465a-bd8f-d4a5d592589d';

-- ============================================
-- DONE! Comments for documentation
-- ============================================
COMMENT ON TABLE moment_reactions IS 'Emoji reactions on moments (like Discord reactions)';
COMMENT ON COLUMN moments.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN moments.video_url IS 'URL to video file in storage';
COMMENT ON COLUMN moments.thumbnail_url IS 'URL to video thumbnail image';
COMMENT ON COLUMN moments.duration_seconds IS 'Video duration in seconds';
COMMENT ON COLUMN moments.reactions_summary IS 'Denormalized reaction counts as JSON {emoji: count}';
