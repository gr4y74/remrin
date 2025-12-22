-- Moments Gallery System - Database Migration
-- Migration: 20241222_add_moments.sql
--
-- This migration adds:
-- 1. moments table for character gallery content
-- 2. moment_likes table for user interactions
-- 3. Triggers for automatic likes_count updates
-- 4. Indexes for efficient queries
-- 5. RLS policies for secure access

-- ============================================================
-- MOMENTS TABLE
-- Stores gallery images/moments shared by characters
-- ============================================================
CREATE TABLE IF NOT EXISTS moments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    likes_count INTEGER DEFAULT 0 NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL
);

COMMENT ON TABLE moments IS 'Gallery moments/images shared by personas for social-style feed';
COMMENT ON COLUMN moments.id IS 'Unique moment identifier';
COMMENT ON COLUMN moments.persona_id IS 'Foreign key to the persona who shared this moment';
COMMENT ON COLUMN moments.image_url IS 'URL of the moment image';
COMMENT ON COLUMN moments.caption IS 'Optional caption text for the moment';
COMMENT ON COLUMN moments.created_at IS 'When the moment was created';
COMMENT ON COLUMN moments.likes_count IS 'Cached count of likes (updated via trigger)';
COMMENT ON COLUMN moments.is_pinned IS 'Whether this moment is pinned to top of gallery';

-- ============================================================
-- MOMENT LIKES TABLE
-- Tracks which users liked which moments
-- ============================================================
CREATE TABLE IF NOT EXISTS moment_likes (
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (moment_id, user_id)
);

COMMENT ON TABLE moment_likes IS 'User likes on moments for engagement tracking';
COMMENT ON COLUMN moment_likes.moment_id IS 'The moment being liked';
COMMENT ON COLUMN moment_likes.user_id IS 'The user who liked the moment';
COMMENT ON COLUMN moment_likes.created_at IS 'When the like was created';

-- ============================================================
-- INDEXES FOR EFFICIENT QUERIES
-- ============================================================

-- Index for fetching moments by persona (character profile page)
CREATE INDEX IF NOT EXISTS idx_moments_persona_id
ON moments(persona_id);

-- Index for fetching recent moments (discovery feed)
CREATE INDEX IF NOT EXISTS idx_moments_created_at
ON moments(created_at DESC);

-- Index for fetching pinned moments first
CREATE INDEX IF NOT EXISTS idx_moments_is_pinned
ON moments(is_pinned DESC, created_at DESC);

-- Index for popular moments (most liked)
CREATE INDEX IF NOT EXISTS idx_moments_likes_count
ON moments(likes_count DESC);

-- Index for user's liked moments
CREATE INDEX IF NOT EXISTS idx_moment_likes_user
ON moment_likes(user_id);

-- Index for checking if user liked a moment
CREATE INDEX IF NOT EXISTS idx_moment_likes_moment
ON moment_likes(moment_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_likes ENABLE ROW LEVEL SECURITY;

-- MOMENTS POLICIES

-- Public can view moments for approved personas
CREATE POLICY "Anyone can view moments for approved personas"
ON moments FOR SELECT
USING (
    persona_id IN (
        SELECT id FROM personas 
        WHERE status = 'approved'
    )
);

-- Persona owners can view their own persona's moments
CREATE POLICY "Owners can view their persona moments"
ON moments FOR SELECT
USING (
    persona_id IN (
        SELECT id FROM personas WHERE owner_id = auth.uid()
    )
);

-- Persona owners can create moments for their personas
CREATE POLICY "Owners can create moments for their personas"
ON moments FOR INSERT
WITH CHECK (
    persona_id IN (
        SELECT id FROM personas WHERE owner_id = auth.uid()
    )
);

-- Persona owners can update their persona's moments
CREATE POLICY "Owners can update their persona moments"
ON moments FOR UPDATE
USING (
    persona_id IN (
        SELECT id FROM personas WHERE owner_id = auth.uid()
    )
);

-- Persona owners can delete their persona's moments
CREATE POLICY "Owners can delete their persona moments"
ON moments FOR DELETE
USING (
    persona_id IN (
        SELECT id FROM personas WHERE owner_id = auth.uid()
    )
);

-- MOMENT_LIKES POLICIES

-- Users can see their own likes
CREATE POLICY "Users can view their own likes"
ON moment_likes FOR SELECT
USING (user_id = auth.uid());

-- Users can see all likes for public moments (for like counts)
CREATE POLICY "Anyone can view likes for approved persona moments"
ON moment_likes FOR SELECT
USING (
    moment_id IN (
        SELECT m.id FROM moments m
        JOIN personas p ON m.persona_id = p.id
        WHERE p.status = 'approved'
    )
);

-- Users can like moments (insert)
CREATE POLICY "Users can like moments"
ON moment_likes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can unlike moments (delete their own likes)
CREATE POLICY "Users can unlike moments"
ON moment_likes FOR DELETE
USING (user_id = auth.uid());

-- ============================================================
-- TRIGGERS FOR AUTOMATIC LIKES COUNT UPDATES
-- ============================================================

-- Function to increment likes_count when a like is added
CREATE OR REPLACE FUNCTION increment_moment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE moments 
    SET likes_count = likes_count + 1
    WHERE id = NEW.moment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes_count when a like is removed
CREATE OR REPLACE FUNCTION decrement_moment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE moments 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.moment_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on like insert
DROP TRIGGER IF EXISTS trigger_increment_moment_likes ON moment_likes;
CREATE TRIGGER trigger_increment_moment_likes
    AFTER INSERT ON moment_likes
    FOR EACH ROW
    EXECUTE FUNCTION increment_moment_likes_count();

-- Trigger on like delete (unlike)
DROP TRIGGER IF EXISTS trigger_decrement_moment_likes ON moment_likes;
CREATE TRIGGER trigger_decrement_moment_likes
    AFTER DELETE ON moment_likes
    FOR EACH ROW
    EXECUTE FUNCTION decrement_moment_likes_count();

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
GRANT SELECT ON moments TO authenticated;
GRANT SELECT ON moments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON moments TO authenticated;
GRANT SELECT, INSERT, DELETE ON moment_likes TO authenticated;
