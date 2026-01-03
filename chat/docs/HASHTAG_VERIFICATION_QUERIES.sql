-- ═══════════════════════════════════════════════════════════════
-- HASHTAG SYSTEM VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to verify installation
-- ═══════════════════════════════════════════════════════════════

-- 1. Check that GIN index was created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname = 'idx_personas_config_gin';
-- Expected: 1 row showing the index on personas table

-- 2. Check hashtag_analytics table exists and has data
SELECT COUNT(*) as total_hashtags 
FROM hashtag_analytics;
-- Expected: Should show number of unique hashtags

-- 3. View top 10 hashtags by usage
SELECT tag, usage_count, search_count, trending_score
FROM hashtag_analytics
ORDER BY usage_count DESC
LIMIT 10;
-- Expected: Should show hashtags like 'official', 'kids', 'gaming', etc.

-- 4. Check that personas have hashtags
SELECT 
    name,
    config->'hashtags' as hashtags
FROM personas 
WHERE config->'hashtags' IS NOT NULL
LIMIT 10;
-- Expected: Should show personas with their hashtags

-- 5. Test hashtag search (find personas with 'official' hashtag)
SELECT id, name, config->'hashtags' as hashtags
FROM personas 
WHERE config->'hashtags' ? 'official';
-- Expected: Should find Mother of Souls and any other official personas

-- 6. Test get_trending_hashtags function
SELECT * FROM get_trending_hashtags(10);
-- Expected: Should return top 10 trending hashtags

-- 7. Test get_hashtag_suggestions function
SELECT * FROM get_hashtag_suggestions('fun', 5);
-- Expected: Should return hashtags starting with 'fun' (funny, fun, etc.)

-- 8. Count personas by category with hashtags
SELECT 
    category,
    COUNT(*) as personas_with_hashtags
FROM personas
WHERE config->'hashtags' IS NOT NULL
GROUP BY category
ORDER BY personas_with_hashtags DESC;
-- Expected: Should show distribution of hashtags across categories

-- 9. Test multiple hashtag search (personas with 'kids' OR 'educational')
SELECT id, name, config->'hashtags' as hashtags
FROM personas 
WHERE config->'hashtags' ?| array['kids', 'educational'];
-- Expected: Should find kid-friendly and educational personas

-- 10. Test multiple hashtag search (personas with 'kids' AND 'educational')
SELECT id, name, config->'hashtags' as hashtags
FROM personas 
WHERE config->'hashtags' ?& array['kids', 'educational'];
-- Expected: Should find personas with BOTH hashtags

-- ═══════════════════════════════════════════════════════════════
-- MANUAL HASHTAG OPERATIONS (Optional)
-- ═══════════════════════════════════════════════════════════════

-- Add hashtags to a specific persona
UPDATE personas 
SET config = jsonb_set(
    COALESCE(config, '{}'::jsonb),
    '{hashtags}',
    '["funny", "helper", "friendly", "playful"]'::jsonb
)
WHERE name = 'Your Persona Name';

-- Add a single hashtag to existing hashtags
UPDATE personas
SET config = jsonb_set(
    config,
    '{hashtags}',
    (COALESCE(config->'hashtags', '[]'::jsonb) || '["new-tag"]'::jsonb)
)
WHERE id = 'persona-id-here';

-- Remove a hashtag from a persona
UPDATE personas
SET config = jsonb_set(
    config,
    '{hashtags}',
    (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements_text(config->'hashtags') elem
        WHERE elem != 'tag-to-remove'
    )
)
WHERE id = 'persona-id-here';

-- Refresh hashtag analytics (run this periodically or after bulk updates)
SELECT update_hashtag_usage_counts();

-- ═══════════════════════════════════════════════════════════════
-- TROUBLESHOOTING
-- ═══════════════════════════════════════════════════════════════

-- If no hashtags appear, check if personas have config data
SELECT 
    COUNT(*) as total_personas,
    COUNT(config) as personas_with_config,
    COUNT(config->'hashtags') as personas_with_hashtags
FROM personas;

-- View raw config data for debugging
SELECT id, name, config
FROM personas
LIMIT 5;

-- Check RLS policies on hashtag_analytics
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'hashtag_analytics';
