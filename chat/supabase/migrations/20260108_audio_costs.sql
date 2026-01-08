-- =============================================================================
-- AUDIO COSTS MIGRATION
-- =============================================================================
-- Version: 1.0.0
-- Created: 2026-01-08
-- Description: Creates the audio_costs table for tracking TTS generation costs
--              across providers for billing, analytics, and budget management
-- =============================================================================

-- ============================================
-- SECTION 1: CREATE AUDIO COSTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audio_costs (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign keys (optional, allowing for anonymous tracking)
    persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Generation details
    provider TEXT NOT NULL,
    character_count INTEGER NOT NULL DEFAULT 0,
    estimated_cost DECIMAL(10, 6) NOT NULL DEFAULT 0.000000,
    
    -- Additional tracking data
    model_id TEXT,
    voice_id TEXT,
    request_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint for voice provider values
    CONSTRAINT audio_costs_provider_check 
    CHECK (provider IN ('edge', 'kokoro', 'elevenlabs'))
);

-- Add comments for documentation
COMMENT ON TABLE audio_costs IS 'Tracks TTS generation costs for billing, analytics, and budget management';
COMMENT ON COLUMN audio_costs.id IS 'Unique identifier for the cost record';
COMMENT ON COLUMN audio_costs.persona_id IS 'Optional reference to the persona this audio was generated for';
COMMENT ON COLUMN audio_costs.user_id IS 'Reference to the user who triggered the generation';
COMMENT ON COLUMN audio_costs.provider IS 'TTS provider used: edge (free), kokoro (self-hosted), elevenlabs (paid)';
COMMENT ON COLUMN audio_costs.character_count IS 'Number of characters processed in this generation';
COMMENT ON COLUMN audio_costs.estimated_cost IS 'Estimated cost in USD based on provider pricing';
COMMENT ON COLUMN audio_costs.model_id IS 'Optional model identifier for providers with multiple models';
COMMENT ON COLUMN audio_costs.voice_id IS 'Voice identifier used for the generation';
COMMENT ON COLUMN audio_costs.request_id IS 'Optional request ID for tracking and debugging';
COMMENT ON COLUMN audio_costs.created_at IS 'Timestamp when the generation occurred';

-- ============================================
-- SECTION 2: PERFORMANCE INDEXES
-- ============================================

-- Index for user-based cost queries
CREATE INDEX IF NOT EXISTS idx_audio_costs_user_id 
ON audio_costs(user_id);

-- Index for persona-based cost queries
CREATE INDEX IF NOT EXISTS idx_audio_costs_persona_id 
ON audio_costs(persona_id) WHERE persona_id IS NOT NULL;

-- Index for provider analytics
CREATE INDEX IF NOT EXISTS idx_audio_costs_provider 
ON audio_costs(provider);

-- Index for date-based queries (daily/monthly cost summaries)
CREATE INDEX IF NOT EXISTS idx_audio_costs_created_at 
ON audio_costs(created_at DESC);

-- Composite index for user + date range queries
CREATE INDEX IF NOT EXISTS idx_audio_costs_user_created 
ON audio_costs(user_id, created_at DESC);

-- Index for request ID lookups
CREATE INDEX IF NOT EXISTS idx_audio_costs_request_id 
ON audio_costs(request_id) WHERE request_id IS NOT NULL;

-- ============================================
-- SECTION 3: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on audio_costs
ALTER TABLE audio_costs ENABLE ROW LEVEL SECURITY;

-- Users can view their own cost records
CREATE POLICY "Users can view own cost records"
ON audio_costs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role can insert cost records (for API routes)
CREATE POLICY "Authenticated users can create cost records"
ON audio_costs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can view all cost records (for analytics)
CREATE POLICY "Admins can view all cost records"
ON audio_costs FOR SELECT
TO authenticated
USING (
    false -- Admin check disabled due to missing membership column
);

-- Admins can delete cost records (for data cleanup)
CREATE POLICY "Admins can delete cost records"
ON audio_costs FOR DELETE
TO authenticated
USING (
    false -- Admin check disabled due to missing membership column
);

-- ============================================
-- SECTION 4: HELPER FUNCTIONS
-- ============================================

-- Function to get daily cost summary for a user
CREATE OR REPLACE FUNCTION get_daily_cost_summary(
    target_user_id UUID,
    target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_characters BIGINT,
    total_cost DECIMAL(10, 6),
    generation_count BIGINT,
    edge_count BIGINT,
    kokoro_count BIGINT,
    elevenlabs_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(character_count), 0)::BIGINT AS total_characters,
        COALESCE(SUM(estimated_cost), 0.0)::DECIMAL(10, 6) AS total_cost,
        COUNT(*)::BIGINT AS generation_count,
        COUNT(*) FILTER (WHERE provider = 'edge')::BIGINT AS edge_count,
        COUNT(*) FILTER (WHERE provider = 'kokoro')::BIGINT AS kokoro_count,
        COUNT(*) FILTER (WHERE provider = 'elevenlabs')::BIGINT AS elevenlabs_count
    FROM audio_costs
    WHERE user_id = target_user_id
    AND DATE(created_at) = target_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly cost summary for a user
CREATE OR REPLACE FUNCTION get_monthly_cost_summary(
    target_user_id UUID,
    target_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    target_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE(
    total_characters BIGINT,
    total_cost DECIMAL(10, 6),
    generation_count BIGINT,
    first_generation TIMESTAMPTZ,
    last_generation TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(character_count), 0)::BIGINT AS total_characters,
        COALESCE(SUM(estimated_cost), 0.0)::DECIMAL(10, 6) AS total_cost,
        COUNT(*)::BIGINT AS generation_count,
        MIN(created_at) AS first_generation,
        MAX(created_at) AS last_generation
    FROM audio_costs
    WHERE user_id = target_user_id
    AND EXTRACT(MONTH FROM created_at) = target_month
    AND EXTRACT(YEAR FROM created_at) = target_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cost by persona
CREATE OR REPLACE FUNCTION get_persona_cost_summary(target_persona_id UUID)
RETURNS TABLE(
    total_characters BIGINT,
    total_cost DECIMAL(10, 6),
    generation_count BIGINT,
    first_generation TIMESTAMPTZ,
    last_generation TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(character_count), 0)::BIGINT AS total_characters,
        COALESCE(SUM(estimated_cost), 0.0)::DECIMAL(10, 6) AS total_cost,
        COUNT(*)::BIGINT AS generation_count,
        MIN(created_at) AS first_generation,
        MAX(created_at) AS last_generation
    FROM audio_costs
    WHERE persona_id = target_persona_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old cost records (for data retention policies)
CREATE OR REPLACE FUNCTION cleanup_old_audio_costs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audio_costs
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for functions
COMMENT ON FUNCTION get_daily_cost_summary(UUID, DATE) IS 'Returns daily cost summary for a user';
COMMENT ON FUNCTION get_monthly_cost_summary(UUID, INTEGER, INTEGER) IS 'Returns monthly cost summary for a user';
COMMENT ON FUNCTION get_persona_cost_summary(UUID) IS 'Returns total cost summary for a persona';
COMMENT ON FUNCTION cleanup_old_audio_costs(INTEGER) IS 'Removes cost records older than specified days (default 365)';

-- ============================================
-- SECTION 5: VERIFICATION QUERIES
-- ============================================

/*
-- Verify table was created
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'audio_costs' 
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'audio_costs';

-- Verify RLS policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'audio_costs';

-- Verify functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%cost%' 
AND routine_schema = 'public';

-- Test insert (replace with actual UUIDs)
-- INSERT INTO audio_costs (user_id, provider, character_count, estimated_cost) 
-- VALUES ('your-user-uuid', 'elevenlabs', 1000, 0.030000);

-- Test daily summary
-- SELECT * FROM get_daily_cost_summary('your-user-uuid');
*/

-- =============================================================================
-- ROLLBACK SCRIPT
-- =============================================================================
-- To rollback this migration, run the following SQL:
/*

-- Drop functions first
DROP FUNCTION IF EXISTS get_daily_cost_summary(UUID, DATE);
DROP FUNCTION IF EXISTS get_monthly_cost_summary(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_persona_cost_summary(UUID);
DROP FUNCTION IF EXISTS cleanup_old_audio_costs(INTEGER);

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can view own cost records" ON audio_costs;
DROP POLICY IF EXISTS "Authenticated users can create cost records" ON audio_costs;
DROP POLICY IF EXISTS "Admins can view all cost records" ON audio_costs;
DROP POLICY IF EXISTS "Admins can delete cost records" ON audio_costs;

-- Drop indexes
DROP INDEX IF EXISTS idx_audio_costs_user_id;
DROP INDEX IF EXISTS idx_audio_costs_persona_id;
DROP INDEX IF EXISTS idx_audio_costs_provider;
DROP INDEX IF EXISTS idx_audio_costs_created_at;
DROP INDEX IF EXISTS idx_audio_costs_user_created;
DROP INDEX IF EXISTS idx_audio_costs_request_id;

-- Drop table
DROP TABLE IF EXISTS audio_costs;

*/

-- =============================================================================
-- PERFORMANCE OPTIMIZATION NOTES
-- =============================================================================
/*
PERFORMANCE CONSIDERATIONS:

1. INDEX STRATEGY:
   - user_id index handles per-user cost lookups
   - created_at DESC enables efficient date-range queries
   - Composite (user_id, created_at) optimizes daily/monthly summaries
   - provider index supports analytics queries

2. PARTITIONING (Future Enhancement):
   - Consider range partitioning by created_at if table exceeds 10M rows
   - Monthly partitions recommended for high-volume systems
   - Example: CREATE TABLE audio_costs_2026_01 PARTITION OF audio_costs
               FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

3. CLEANUP STRATEGY:
   - Use cleanup_old_audio_costs() via pg_cron for periodic cleanup
   - Recommended: Keep 1 year of detailed records
   - Consider aggregating older data into monthly summaries

4. COST TRACKING ACCURACY:
   - estimated_cost uses DECIMAL(10, 6) for precision to 6 decimal places
   - $0.000030 per character = $0.030 per 1000 characters (ElevenLabs standard)

5. QUERY PATTERNS TO OPTIMIZE FOR:
   - Daily cost: WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE
   - Monthly cost: WHERE user_id = $1 AND created_at >= date_trunc('month', NOW())
   - Persona cost: WHERE persona_id = $1

6. MONITORING:
   - Track table size: SELECT pg_size_pretty(pg_total_relation_size('audio_costs'));
   - Track row count: SELECT reltuples::bigint FROM pg_class WHERE relname = 'audio_costs';
*/
