-- =============================================================================
-- AUDIO SYSTEM PERFORMANCE OPTIMIZATIONS
-- =============================================================================
-- Version: 1.0.1
-- Created: 2026-01-08
-- Description: Additional indexes, RPC functions, and performance enhancements
-- =============================================================================

-- ============================================
-- SECTION 1: ADDITIONAL RPC FUNCTIONS
-- ============================================

-- Function to increment cache access count (atomic operation)
CREATE OR REPLACE FUNCTION increment_audio_cache_hits(
    cache_hash TEXT
) RETURNS void AS $$
BEGIN
    UPDATE audio_cache
    SET 
        access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE text_hash = cache_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_audio_cache_hits(TEXT) IS 
    'Atomically increments the hit count and updates last accessed time for a cache entry';

-- Function to get audio usage by provider for analytics
CREATE OR REPLACE FUNCTION get_audio_usage_by_provider(
    user_uuid UUID,
    from_date TIMESTAMPTZ DEFAULT date_trunc('month', CURRENT_DATE),
    to_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS TABLE (
    provider TEXT,
    generation_count BIGINT,
    total_chars BIGINT,
    total_duration NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ag.provider,
        COUNT(*)::BIGINT as generation_count,
        SUM(ag.chars_count)::BIGINT as total_chars,
        SUM(ag.duration_seconds) as total_duration
    FROM audio_generations ag
    WHERE ag.user_id = user_uuid
      AND ag.created_at >= from_date
      AND ag.created_at < to_date
    GROUP BY ag.provider;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_audio_usage_by_provider(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 
    'Gets audio generation usage breakdown by provider for a user in a date range';

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_audio_cache_stats()
RETURNS TABLE (
    total_entries BIGINT,
    total_size_bytes BIGINT,
    oldest_entry TIMESTAMPTZ,
    newest_entry TIMESTAMPTZ,
    average_hit_count NUMERIC,
    entries_by_provider JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_entries,
        COALESCE(SUM(file_size_bytes), 0)::BIGINT as total_size_bytes,
        MIN(created_at) as oldest_entry,
        MAX(created_at) as newest_entry,
        AVG(access_count) as average_hit_count,
        jsonb_object_agg(
            COALESCE(voice_provider, 'unknown'),
            provider_count
        ) as entries_by_provider
    FROM audio_cache
    CROSS JOIN LATERAL (
        SELECT voice_provider, COUNT(*) as provider_count
        FROM audio_cache
        GROUP BY voice_provider
    ) provider_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_audio_cache_stats() IS 
    'Returns comprehensive statistics about the audio cache';

-- Function to cleanup old cache entries (improved version)
CREATE OR REPLACE FUNCTION cleanup_old_audio_cache(
    max_age_hours INTEGER DEFAULT 720, -- 30 days
    max_entries INTEGER DEFAULT 10000,
    dry_run BOOLEAN DEFAULT false
) RETURNS TABLE (
    entries_to_delete BIGINT,
    bytes_to_free BIGINT,
    entries_by_age BIGINT,
    entries_by_count BIGINT
) AS $$
DECLARE
    age_cutoff TIMESTAMPTZ;
    age_entries BIGINT;
    count_entries BIGINT;
    age_bytes BIGINT;
    count_bytes BIGINT;
BEGIN
    age_cutoff := NOW() - (max_age_hours || ' hours')::INTERVAL;
    
    -- Count entries older than max_age
    SELECT COUNT(*), COALESCE(SUM(file_size_bytes), 0)
    INTO age_entries, age_bytes
    FROM audio_cache
    WHERE last_accessed_at < age_cutoff;
    
    -- Count entries exceeding max_entries (LRU)
    WITH ranked AS (
        SELECT id, file_size_bytes,
               ROW_NUMBER() OVER (ORDER BY last_accessed_at DESC) as rn
        FROM audio_cache
    )
    SELECT COUNT(*), COALESCE(SUM(file_size_bytes), 0)
    INTO count_entries, count_bytes
    FROM ranked
    WHERE rn > max_entries;
    
    -- Perform deletion if not dry run
    IF NOT dry_run THEN
        -- Delete by age
        DELETE FROM audio_cache
        WHERE last_accessed_at < age_cutoff;
        
        -- Delete excess entries (LRU)
        WITH ranked AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY last_accessed_at DESC) as rn
            FROM audio_cache
        )
        DELETE FROM audio_cache
        WHERE id IN (SELECT id FROM ranked WHERE rn > max_entries);
    END IF;
    
    RETURN QUERY SELECT 
        age_entries + count_entries,
        age_bytes + count_bytes,
        age_entries,
        count_entries;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_audio_cache(INTEGER, INTEGER, BOOLEAN) IS 
    'Cleans up old cache entries based on age and count limits. Use dry_run=true to preview.';

-- ============================================
-- SECTION 2: ADDITIONAL INDEXES
-- ============================================

-- Composite index for cache cleanup operations
CREATE INDEX IF NOT EXISTS idx_audio_cache_cleanup 
    ON audio_cache(last_accessed_at, access_count);

-- Index for voice usage sorting
CREATE INDEX IF NOT EXISTS idx_audio_cache_voice_hits 
    ON audio_cache(voice_id, access_count DESC);

-- Index for generation date range queries
CREATE INDEX IF NOT EXISTS idx_audio_generations_date 
    ON audio_generations(created_at DESC);

-- Partial index for high-hit cache entries (frequently accessed)
CREATE INDEX IF NOT EXISTS idx_audio_cache_popular 
    ON audio_cache(access_count DESC) 
    WHERE access_count > 10;

-- ============================================
-- SECTION 3: MATERIALIZED VIEW FOR ANALYTICS
-- ============================================

-- Create a materialized view for audio analytics (refresh hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS audio_analytics_summary AS
SELECT 
    date_trunc('day', created_at) as day,
    provider,
    COUNT(*) as generation_count,
    SUM(chars_count) as total_chars,
    SUM(duration_seconds) as total_duration,
    COUNT(DISTINCT user_id) as unique_users
FROM audio_generations
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY date_trunc('day', created_at), provider
ORDER BY day DESC;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_audio_analytics_summary 
    ON audio_analytics_summary(day, provider);

-- Function to refresh the analytics summary
CREATE OR REPLACE FUNCTION refresh_audio_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY audio_analytics_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_audio_analytics() IS 
    'Refreshes the audio analytics materialized view. Call via pg_cron hourly.';

-- ============================================
-- SECTION 4: CONNECTION POOLING HINTS
-- ============================================
-- Note: Connection pooling is typically configured at the infrastructure level
-- (pgBouncer, Supabase Pooler) rather than in migrations.
-- 
-- Recommended Supabase settings:
-- - Enable connection pooling: Settings > Database > Connection pooling
-- - Pool size: 15-25 connections for typical workloads
-- - Pool mode: Transaction (recommended for serverless)
-- - Statement timeout: 30s for TTS operations

-- ============================================
-- SECTION 5: SCHEDULED MAINTENANCE SETUP
-- ============================================
-- Use pg_cron to schedule maintenance tasks (requires pg_cron extension)
-- Example cron jobs to add via Supabase SQL Editor:

/*
-- Refresh analytics summary every hour
SELECT cron.schedule('refresh-audio-analytics', '0 * * * *', 
    'SELECT refresh_audio_analytics()');

-- Clean old cache entries daily at 3 AM
SELECT cron.schedule('cleanup-audio-cache', '0 3 * * *', 
    'SELECT cleanup_old_audio_cache(720, 10000, false)');

-- Vacuum audio tables weekly on Sunday at 4 AM
SELECT cron.schedule('vacuum-audio-tables', '0 4 * * 0', 
    'VACUUM ANALYZE audio_cache, audio_generations, community_voices');
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
/*
-- Check indexes exist
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename IN ('audio_cache', 'audio_generations')
ORDER BY tablename, indexname;

-- Check functions exist
SELECT proname, prosrc FROM pg_proc 
WHERE proname LIKE '%audio%' OR proname LIKE '%cache%';

-- Check materialized view
SELECT * FROM audio_analytics_summary LIMIT 10;

-- Test cache hit increment
SELECT increment_audio_cache_hits('test-hash');

-- Test cleanup (dry run)
SELECT * FROM cleanup_old_audio_cache(720, 10000, true);
*/
