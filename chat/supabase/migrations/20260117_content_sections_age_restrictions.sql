-- Content Sections & Age Restrictions Migration
-- Migration: 20260117_content_sections_age_restrictions.sql
-- 
-- This migration adds:
-- 1. age_rating enum type for content classification
-- 2. content_sections table for categorized featured content
-- 3. section_personas junction table for many-to-many relationships
-- 4. RLS policies for age-based content filtering
-- 5. Indexes for efficient discovery queries

-- ============================================================
-- AGE RATING ENUM TYPE
-- ============================================================
DO $$ BEGIN
    CREATE TYPE age_rating AS ENUM ('everyone', 'kids', 'teen', 'mature');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE age_rating IS 'Age-based content ratings: everyone (all ages), kids (0-12), teen (13-17), mature (18+)';

-- ============================================================
-- CONTENT SECTIONS TABLE
-- Stores categorized sections for the discovery page
-- ============================================================
CREATE TABLE IF NOT EXISTS content_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT, -- emoji or icon identifier
    color TEXT, -- hex color for UI theming
    age_rating age_rating DEFAULT 'everyone' NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE content_sections IS 'Categorized content sections for the discovery page (e.g., Kids, Gaming, Education)';
COMMENT ON COLUMN content_sections.name IS 'Display name of the section';
COMMENT ON COLUMN content_sections.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN content_sections.description IS 'Brief description shown in section header';
COMMENT ON COLUMN content_sections.icon IS 'Emoji or icon identifier for visual representation';
COMMENT ON COLUMN content_sections.color IS 'Hex color code for section theming';
COMMENT ON COLUMN content_sections.age_rating IS 'Minimum age rating required to view this section';
COMMENT ON COLUMN content_sections.sort_order IS 'Display order on discovery page (lower = earlier)';
COMMENT ON COLUMN content_sections.is_active IS 'Whether section is currently visible on discovery page';

-- ============================================================
-- SECTION PERSONAS JUNCTION TABLE
-- Many-to-many relationship between sections and personas
-- ============================================================
CREATE TABLE IF NOT EXISTS section_personas (
    section_id UUID NOT NULL REFERENCES content_sections(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    added_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (section_id, persona_id)
);

COMMENT ON TABLE section_personas IS 'Junction table mapping personas to content sections (many-to-many)';
COMMENT ON COLUMN section_personas.section_id IS 'Reference to content section';
COMMENT ON COLUMN section_personas.persona_id IS 'Reference to persona';
COMMENT ON COLUMN section_personas.sort_order IS 'Display order within the section';
COMMENT ON COLUMN section_personas.added_at IS 'When persona was added to this section';
COMMENT ON COLUMN section_personas.added_by IS 'Admin user who added this persona to the section';

-- ============================================================
-- INDEXES FOR EFFICIENT QUERIES
-- ============================================================

-- Index for fetching active sections in order
CREATE INDEX IF NOT EXISTS idx_content_sections_active_order 
ON content_sections(is_active, sort_order) 
WHERE is_active = TRUE;

-- Index for section lookup by slug
CREATE INDEX IF NOT EXISTS idx_content_sections_slug 
ON content_sections(slug);

-- Index for age-based filtering
CREATE INDEX IF NOT EXISTS idx_content_sections_age_rating 
ON content_sections(age_rating);

-- Index for fetching personas in a section
CREATE INDEX IF NOT EXISTS idx_section_personas_section 
ON section_personas(section_id, sort_order);

-- Index for finding which sections a persona belongs to
CREATE INDEX IF NOT EXISTS idx_section_personas_persona 
ON section_personas(persona_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_personas ENABLE ROW LEVEL SECURITY;

-- CONTENT_SECTIONS POLICIES

-- Public can view active sections (age filtering handled in application logic)
CREATE POLICY "Anyone can view active content sections"
ON content_sections FOR SELECT
USING (is_active = TRUE);

-- Authenticated users can view all sections (for admin purposes)
CREATE POLICY "Authenticated users can view all sections"
ON content_sections FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can modify sections (implement admin check via application)
-- For now, allow authenticated users to insert/update/delete
-- TODO: Add proper admin role check
CREATE POLICY "Authenticated users can manage sections"
ON content_sections FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- SECTION_PERSONAS POLICIES

-- Public can view persona assignments for active sections
CREATE POLICY "Anyone can view personas in active sections"
ON section_personas FOR SELECT
USING (
    section_id IN (
        SELECT id FROM content_sections WHERE is_active = TRUE
    )
);

-- Authenticated users can view all assignments
CREATE POLICY "Authenticated users can view all section assignments"
ON section_personas FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only authenticated users can manage assignments
CREATE POLICY "Authenticated users can manage section assignments"
ON section_personas FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_content_sections_updated_at ON content_sections;
CREATE TRIGGER trigger_update_content_sections_updated_at
    BEFORE UPDATE ON content_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_content_sections_updated_at();

-- ============================================================
-- SEED DEFAULT SECTIONS
-- ============================================================

-- Insert default content sections
INSERT INTO content_sections (name, slug, description, icon, color, age_rating, sort_order) VALUES
    ('Kids', 'kids', 'Fun and educational content for children', '🧒', '#10b981', 'kids', 10),
    ('Gaming', 'gaming', 'Video game characters and gaming companions', '🎮', '#8b5cf6', 'teen', 20),
    ('Education', 'education', 'Learning and tutoring companions', '📚', '#3b82f6', 'everyone', 30),
    ('Religion & Spirituality', 'religion', 'Faith-based and spiritual guidance', '🙏', '#f59e0b', 'everyone', 40),
    ('Entertainment', 'entertainment', 'Movies, TV, and pop culture characters', '🎬', '#ec4899', 'teen', 50),
    ('Lifestyle', 'lifestyle', 'Health, fitness, and daily life companions', '💪', '#06b6d4', 'everyone', 60)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
GRANT SELECT ON content_sections TO authenticated;
GRANT SELECT ON content_sections TO anon;
GRANT SELECT ON section_personas TO authenticated;
GRANT SELECT ON section_personas TO anon;
