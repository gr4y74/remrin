-- ═══════════════════════════════════════════════════════════════
-- HASHTAG SYSTEM FOR PERSONA DISCOVERY
-- Migration: 20250103_add_hashtag_system.sql
-- ═══════════════════════════════════════════════════════════════
-- 
-- This migration adds:
-- 1. GIN index on personas.config for fast JSONB hashtag queries
-- 2. Hashtag analytics table for tracking usage and trends
-- 3. Helper functions for hashtag operations
-- 4. Sample hashtags for existing personas
-- ═══════════════════════════════════════════════════════════════

-- ============================================================
-- 1. ADD GIN INDEX FOR FAST JSONB QUERIES
-- ============================================================

-- This index enables fast queries like:
-- WHERE config->'hashtags' ? 'funny'
-- WHERE config->'hashtags' ?| array['funny', 'anime']
CREATE INDEX IF NOT EXISTS idx_personas_config_gin 
ON personas USING GIN (config);

COMMENT ON INDEX idx_personas_config_gin IS 'GIN index for fast JSONB hashtag queries on personas.config';


-- ============================================================
-- 2. HASHTAG ANALYTICS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS hashtag_analytics (
    tag TEXT PRIMARY KEY,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    search_count INTEGER DEFAULT 0 NOT NULL,
    click_count INTEGER DEFAULT 0 NOT NULL,
    trending_score FLOAT DEFAULT 0 NOT NULL,
    last_searched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE hashtag_analytics IS 'Tracks hashtag usage, searches, and trending scores for discovery';
COMMENT ON COLUMN hashtag_analytics.tag IS 'Hashtag name (lowercase, without # symbol)';
COMMENT ON COLUMN hashtag_analytics.usage_count IS 'Number of personas using this hashtag';
COMMENT ON COLUMN hashtag_analytics.search_count IS 'Number of times users searched for this hashtag';
COMMENT ON COLUMN hashtag_analytics.click_count IS 'Number of times users clicked on personas with this hashtag';
COMMENT ON COLUMN hashtag_analytics.trending_score IS 'Calculated trending score (higher = more trending)';

-- Index for trending queries
CREATE INDEX IF NOT EXISTS idx_hashtag_analytics_trending 
ON hashtag_analytics(trending_score DESC);

-- Index for recent searches
CREATE INDEX IF NOT EXISTS idx_hashtag_analytics_recent 
ON hashtag_analytics(last_searched_at DESC NULLS LAST);


-- ============================================================
-- 3. HELPER FUNCTIONS
-- ============================================================

-- Function to increment hashtag search count
CREATE OR REPLACE FUNCTION increment_hashtag_search(tag_name TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO hashtag_analytics (tag, search_count, last_searched_at, updated_at)
    VALUES (LOWER(tag_name), 1, NOW(), NOW())
    ON CONFLICT (tag) DO UPDATE SET
        search_count = hashtag_analytics.search_count + 1,
        last_searched_at = NOW(),
        updated_at = NOW(),
        trending_score = (hashtag_analytics.search_count + 1) * 0.5 + 
                        hashtag_analytics.click_count * 1.0 + 
                        hashtag_analytics.usage_count * 0.3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_hashtag_search IS 'Increments search count and updates trending score for a hashtag';


-- Function to increment hashtag click count
CREATE OR REPLACE FUNCTION increment_hashtag_click(tag_name TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO hashtag_analytics (tag, click_count, updated_at)
    VALUES (LOWER(tag_name), 1, NOW())
    ON CONFLICT (tag) DO UPDATE SET
        click_count = hashtag_analytics.click_count + 1,
        updated_at = NOW(),
        trending_score = hashtag_analytics.search_count * 0.5 + 
                        (hashtag_analytics.click_count + 1) * 1.0 + 
                        hashtag_analytics.usage_count * 0.3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_hashtag_click IS 'Increments click count and updates trending score for a hashtag';


-- Function to update hashtag usage counts (run periodically)
CREATE OR REPLACE FUNCTION update_hashtag_usage_counts()
RETURNS VOID AS $$
BEGIN
    -- Update usage counts based on actual persona data
    WITH hashtag_counts AS (
        SELECT 
            jsonb_array_elements_text(config->'hashtags') AS tag,
            COUNT(*) AS count
        FROM personas
        WHERE config->'hashtags' IS NOT NULL
        AND visibility = 'PUBLIC'
        GROUP BY tag
    )
    INSERT INTO hashtag_analytics (tag, usage_count, updated_at)
    SELECT 
        LOWER(tag) AS tag,
        count::INTEGER AS usage_count,
        NOW() AS updated_at
    FROM hashtag_counts
    ON CONFLICT (tag) DO UPDATE SET
        usage_count = EXCLUDED.usage_count,
        updated_at = NOW(),
        trending_score = hashtag_analytics.search_count * 0.5 + 
                        hashtag_analytics.click_count * 1.0 + 
                        EXCLUDED.usage_count * 0.3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_hashtag_usage_counts IS 'Recalculates usage counts for all hashtags based on current persona data';


-- Function to get trending hashtags
CREATE OR REPLACE FUNCTION get_trending_hashtags(limit_count INT DEFAULT 20)
RETURNS TABLE (
    tag TEXT,
    usage_count INTEGER,
    search_count INTEGER,
    trending_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ha.tag,
        ha.usage_count,
        ha.search_count,
        ha.trending_score
    FROM hashtag_analytics ha
    WHERE ha.usage_count > 0  -- Only show hashtags actually in use
    ORDER BY ha.trending_score DESC, ha.usage_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_trending_hashtags IS 'Returns top trending hashtags ordered by trending score';


-- Function to get hashtag suggestions (autocomplete)
CREATE OR REPLACE FUNCTION get_hashtag_suggestions(partial TEXT, limit_count INT DEFAULT 10)
RETURNS TABLE (
    tag TEXT,
    usage_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ha.tag,
        ha.usage_count
    FROM hashtag_analytics ha
    WHERE ha.tag LIKE LOWER(partial) || '%'
    AND ha.usage_count > 0
    ORDER BY ha.usage_count DESC, ha.tag ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_hashtag_suggestions IS 'Returns hashtag suggestions for autocomplete based on partial match';


-- ============================================================
-- 4. SEED SAMPLE HASHTAGS FOR EXISTING PERSONAS
-- ============================================================

-- Add hashtags to Mother of Souls
UPDATE personas 
SET config = jsonb_set(
    COALESCE(config, '{}'::jsonb),
    '{hashtags}',
    '["official", "guide", "mystical", "creator", "wise", "spiritual"]'::jsonb
)
WHERE name = 'The Mother of Souls'
AND (config->'hashtags' IS NULL OR jsonb_array_length(config->'hashtags') = 0);

-- Add generic hashtags to personas based on category
UPDATE personas
SET config = jsonb_set(
    COALESCE(config, '{}'::jsonb),
    '{hashtags}',
    CASE category
        WHEN 'kids' THEN '["kids", "family-friendly", "educational", "fun"]'::jsonb
        WHEN 'gaming' THEN '["gaming", "playful", "competitive", "fun"]'::jsonb
        WHEN 'education' THEN '["educational", "teacher", "helper", "knowledgeable"]'::jsonb
        WHEN 'productivity' THEN '["productivity", "helper", "efficient", "organized"]'::jsonb
        WHEN 'entertainment' THEN '["entertainment", "fun", "creative", "engaging"]'::jsonb
        WHEN 'wellness' THEN '["wellness", "supportive", "calm", "mindful"]'::jsonb
        WHEN 'creative' THEN '["creative", "artistic", "imaginative", "inspiring"]'::jsonb
        ELSE '["companion", "friendly", "helpful"]'::jsonb
    END
)
WHERE visibility = 'PUBLIC'
AND (config->'hashtags' IS NULL OR jsonb_array_length(config->'hashtags') = 0)
AND category IS NOT NULL;

-- Initialize hashtag analytics with current usage
SELECT update_hashtag_usage_counts();


-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE hashtag_analytics ENABLE ROW LEVEL SECURITY;

-- Public read access for hashtag analytics
CREATE POLICY "Anyone can view hashtag analytics"
ON hashtag_analytics FOR SELECT
TO public
USING (true);

-- Only service role can modify hashtag analytics
CREATE POLICY "Only service role can modify hashtag analytics"
ON hashtag_analytics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ============================================================
-- 6. GRANT PERMISSIONS
-- ============================================================

GRANT SELECT ON hashtag_analytics TO authenticated;
GRANT SELECT ON hashtag_analytics TO anon;

GRANT EXECUTE ON FUNCTION get_trending_hashtags TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_hashtags TO anon;
GRANT EXECUTE ON FUNCTION get_hashtag_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION get_hashtag_suggestions TO anon;


-- ============================================================
-- VERIFICATION QUERIES (Run these to verify installation)
-- ============================================================

-- Check GIN index exists:
-- SELECT indexname FROM pg_indexes WHERE indexname = 'idx_personas_config_gin';

-- Check hashtag_analytics table exists:
-- SELECT tablename FROM pg_tables WHERE tablename = 'hashtag_analytics';

-- View sample hashtags:
-- SELECT name, config->'hashtags' as hashtags FROM personas WHERE config->'hashtags' IS NOT NULL LIMIT 5;

-- Get trending hashtags:
-- SELECT * FROM get_trending_hashtags(10);

-- Test hashtag search:
-- SELECT id, name FROM personas WHERE config->'hashtags' ? 'official';


-- ═══════════════════════════════════════════════════════════════
-- DONE! Hashtag system is ready.
-- ═══════════════════════════════════════════════════════════════
