-- Add moderation workflow to personas
-- Migration: Add status field and moderation tracking

-- Add status field to personas (moderation workflow)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
-- Possible values: 'draft', 'pending_review', 'approved', 'rejected', 'suspended'

-- Add moderation timestamps
ALTER TABLE personas ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add category and tags for discovery
ALTER TABLE personas ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE personas ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE personas ADD COLUMN IF NOT EXISTS intro_message TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Add creator attribution
ALTER TABLE personas ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users;

-- Create content_moderation table to track all moderation actions
CREATE TABLE IF NOT EXISTS content_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES auth.users NOT NULL,
    action TEXT NOT NULL,  -- 'submit', 'approve', 'reject', 'suspend', 'feature', 'unfeature'
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table for discovery
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,  -- emoji or icon name
    color TEXT,  -- hex color for UI
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (slug, name, description, icon, color, sort_order) VALUES
    ('general', 'General', 'General purpose AI companions', '🌟', '#6366f1', 0),
    ('romance', 'Romance', 'Romantic roleplay and dating simulation', '💕', '#ec4899', 1),
    ('adventure', 'Adventure', 'Fantasy and adventure companions', '⚔️', '#f59e0b', 2),
    ('helper', 'Helper', 'Productivity and assistance focused', '🧠', '#10b981', 3),
    ('anime', 'Anime & Game', 'Characters from anime and games', '🎮', '#8b5cf6', 4),
    ('original', 'Original', 'Original character creations', '✨', '#06b6d4', 5),
    ('education', 'Education', 'Learning and tutoring companions', '📚', '#3b82f6', 6)
ON CONFLICT (slug) DO NOTHING;

-- Create index for faster moderation queries
CREATE INDEX IF NOT EXISTS idx_personas_status ON personas(status);
CREATE INDEX IF NOT EXISTS idx_personas_category ON personas(category);
CREATE INDEX IF NOT EXISTS idx_personas_is_featured ON personas(is_featured);
CREATE INDEX IF NOT EXISTS idx_content_moderation_persona ON content_moderation(persona_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_created ON content_moderation(created_at DESC);

-- RLS policies for content_moderation (only admins can insert)
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;

-- Everyone can view moderation history for personas they own
CREATE POLICY "Users can view moderation history for their personas"
ON content_moderation FOR SELECT
USING (
    persona_id IN (
        SELECT id FROM personas WHERE owner_id = auth.uid()
    )
);

-- Categories are public read
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
ON categories FOR SELECT
USING (true);

-- Update personas RLS to allow status-based queries
-- (Keep existing policies, just add index support)

COMMENT ON COLUMN personas.status IS 'Moderation status: draft, pending_review, approved, rejected, suspended';
COMMENT ON TABLE content_moderation IS 'Audit log of all moderation actions on personas';
COMMENT ON TABLE categories IS 'Discovery categories for character browsing';
