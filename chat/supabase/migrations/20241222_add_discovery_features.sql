-- Add discovery features for Talkie-style character discovery and engagement
-- Migration: 20241222_add_discovery_features.sql
-- 
-- This migration adds:
-- 1. persona_stats table for tracking engagement metrics
-- 2. character_follows table for user-to-persona follow relationships
-- 3. Indexes for efficient discovery queries
-- 4. RLS policies for secure access
-- 5. Triggers for automatic follower count updates

-- ============================================================
-- PERSONA STATS TABLE
-- Tracks engagement metrics for each persona
-- ============================================================
CREATE TABLE IF NOT EXISTS persona_stats (
    persona_id UUID PRIMARY KEY REFERENCES personas(id) ON DELETE CASCADE,
    total_chats INTEGER DEFAULT 0 NOT NULL,
    total_messages INTEGER DEFAULT 0 NOT NULL,
    followers_count INTEGER DEFAULT 0 NOT NULL,
    trending_score FLOAT DEFAULT 0 NOT NULL,
    last_chat_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE persona_stats IS 'Engagement metrics for persona discovery and trending rankings';
COMMENT ON COLUMN persona_stats.persona_id IS 'Foreign key to personas table (1:1 relationship)';
COMMENT ON COLUMN persona_stats.total_chats IS 'Total number of chat sessions started with this persona';
COMMENT ON COLUMN persona_stats.total_messages IS 'Total number of messages exchanged with this persona';
COMMENT ON COLUMN persona_stats.followers_count IS 'Number of users following this persona';
COMMENT ON COLUMN persona_stats.trending_score IS 'Calculated score for trending/discovery algorithms';
COMMENT ON COLUMN persona_stats.last_chat_at IS 'Timestamp of the most recent chat activity';
COMMENT ON COLUMN persona_stats.updated_at IS 'Last time stats were updated';

-- ============================================================
-- CHARACTER FOLLOWS TABLE
-- Tracks which users follow which personas
-- ============================================================
CREATE TABLE IF NOT EXISTS character_follows (
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (persona_id, user_id)
);

COMMENT ON TABLE character_follows IS 'User follow relationships with personas for personalized feeds';
COMMENT ON COLUMN character_follows.persona_id IS 'The persona being followed';
COMMENT ON COLUMN character_follows.user_id IS 'The user who is following';
COMMENT ON COLUMN character_follows.followed_at IS 'When the follow relationship was created';

-- ============================================================
-- INDEXES FOR DISCOVERY QUERIES
-- Note: idx_personas_category and idx_personas_is_featured 
-- already exist from 20241222_add_moderation_workflow.sql
-- ============================================================

-- Index for trending score queries (highest trending first)
CREATE INDEX IF NOT EXISTS idx_persona_stats_trending_score 
ON persona_stats(trending_score DESC);

-- Index for popular personas queries (most followers first)
CREATE INDEX IF NOT EXISTS idx_persona_stats_followers_count 
ON persona_stats(followers_count DESC);

-- Index for recent activity queries
CREATE INDEX IF NOT EXISTS idx_persona_stats_last_chat 
ON persona_stats(last_chat_at DESC NULLS LAST);

-- Index for user's followed personas
CREATE INDEX IF NOT EXISTS idx_character_follows_user 
ON character_follows(user_id);

-- Index for finding followers of a persona
CREATE INDEX IF NOT EXISTS idx_character_follows_persona 
ON character_follows(persona_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE persona_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_follows ENABLE ROW LEVEL SECURITY;

-- PERSONA_STATS POLICIES
-- Public read access for visible (approved) personas
CREATE POLICY "Anyone can view stats for approved personas"
ON persona_stats FOR SELECT
USING (
    persona_id IN (
        SELECT id FROM personas 
        WHERE status = 'approved' 
        OR owner_id = auth.uid()
    )
);

-- Owners can view their own persona stats (regardless of status)
CREATE POLICY "Owners can view their persona stats"
ON persona_stats FOR SELECT
USING (
    persona_id IN (
        SELECT id FROM personas WHERE owner_id = auth.uid()
    )
);

-- CHARACTER_FOLLOWS POLICIES
-- Users can see their own follows
CREATE POLICY "Users can view their own follows"
ON character_follows FOR SELECT
USING (user_id = auth.uid());

-- Users can follow personas (insert)
CREATE POLICY "Users can follow personas"
ON character_follows FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can unfollow personas (delete their own follows)
CREATE POLICY "Users can unfollow personas"
ON character_follows FOR DELETE
USING (user_id = auth.uid());

-- Public can see who follows approved personas (for social proof)
CREATE POLICY "Anyone can view follows for approved personas"
ON character_follows FOR SELECT
USING (
    persona_id IN (
        SELECT id FROM personas WHERE status = 'approved'
    )
);

-- ============================================================
-- TRIGGERS FOR AUTOMATIC FOLLOWER COUNT UPDATES
-- ============================================================

-- Function to increment follower count
CREATE OR REPLACE FUNCTION increment_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure persona_stats row exists
    INSERT INTO persona_stats (persona_id, followers_count)
    VALUES (NEW.persona_id, 1)
    ON CONFLICT (persona_id) 
    DO UPDATE SET 
        followers_count = persona_stats.followers_count + 1,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement follower count
CREATE OR REPLACE FUNCTION decrement_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE persona_stats 
    SET 
        followers_count = GREATEST(0, followers_count - 1),
        updated_at = NOW()
    WHERE persona_id = OLD.persona_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on follow insert
DROP TRIGGER IF EXISTS trigger_increment_followers ON character_follows;
CREATE TRIGGER trigger_increment_followers
    AFTER INSERT ON character_follows
    FOR EACH ROW
    EXECUTE FUNCTION increment_followers_count();

-- Trigger on follow delete (unfollow)
DROP TRIGGER IF EXISTS trigger_decrement_followers ON character_follows;
CREATE TRIGGER trigger_decrement_followers
    AFTER DELETE ON character_follows
    FOR EACH ROW
    EXECUTE FUNCTION decrement_followers_count();

-- ============================================================
-- HELPER FUNCTION: Initialize stats for existing personas
-- ============================================================
CREATE OR REPLACE FUNCTION initialize_persona_stats()
RETURNS void AS $$
BEGIN
    INSERT INTO persona_stats (persona_id)
    SELECT id FROM personas
    WHERE id NOT IN (SELECT persona_id FROM persona_stats)
    ON CONFLICT (persona_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Initialize stats for any existing personas
SELECT initialize_persona_stats();

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
GRANT SELECT ON persona_stats TO authenticated;
GRANT SELECT ON persona_stats TO anon;
GRANT SELECT, INSERT, DELETE ON character_follows TO authenticated;
