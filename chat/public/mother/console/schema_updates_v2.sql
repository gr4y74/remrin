-- ═══════════════════════════════════════════════════════════════
-- UNIVERSAL CONSOLE V2.0 - DATABASE SCHEMA UPDATES
-- ═══════════════════════════════════════════════════════════════
-- Run these migrations in your Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. USER RATE LIMITING
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_limits (
    user_id TEXT PRIMARY KEY,
    requests_today INTEGER DEFAULT 0,
    max_requests_per_day INTEGER DEFAULT 50,
    is_premium BOOLEAN DEFAULT false,
    last_reset TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to increment request counter
CREATE OR REPLACE FUNCTION increment_user_requests(uid TEXT)
RETURNS VOID AS $$
BEGIN
    -- Reset counter if it's a new day
    UPDATE user_limits
    SET 
        requests_today = CASE 
            WHEN DATE(last_reset) < CURRENT_DATE THEN 1
            ELSE requests_today + 1
        END,
        last_reset = CASE
            WHEN DATE(last_reset) < CURRENT_DATE THEN NOW()
            ELSE last_reset
        END
    WHERE user_id = uid;
    
    -- Create user if doesn't exist
    INSERT INTO user_limits (user_id, requests_today, max_requests_per_day)
    VALUES (uid, 1, 50)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- 2. PERSONA OWNERSHIP & PERMISSIONS
-- ─────────────────────────────────────────────────────────────
-- Add owner and visibility to personas table
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS owner_id TEXT,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'PUBLIC' 
    CHECK (visibility IN ('PUBLIC', 'PRIVATE', 'SHARED'));

-- Create persona access control table
CREATE TABLE IF NOT EXISTS persona_access (
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    user_id TEXT,
    access_level TEXT DEFAULT 'READ_ONLY' 
        CHECK (access_level IN ('OWNER', 'COLLABORATOR', 'READ_ONLY')),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (persona_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_persona_access_user ON persona_access(user_id);

-- ─────────────────────────────────────────────────────────────
-- 3. CROSS-PERSONA SHARED FACTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shared_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    fact_type TEXT NOT NULL CHECK (fact_type IN ('MEDICAL', 'PREFERENCE', 'IDENTITY', 'SAFETY', 'GOAL', 'RELATIONSHIP')),
    shared_with_all BOOLEAN DEFAULT true,
    importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_facts_user ON shared_facts(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_facts_type ON shared_facts(fact_type);

-- ─────────────────────────────────────────────────────────────
-- 4. ENHANCED MEMORIES TABLE
-- ─────────────────────────────────────────────────────────────
-- Add emotion tracking to memories
ALTER TABLE memories 
ADD COLUMN IF NOT EXISTS emotion TEXT DEFAULT 'neutral' 
    CHECK (emotion IN ('positive', 'negative', 'anxious', 'neutral'));

-- ─────────────────────────────────────────────────────────────
-- 5. TIME-DECAY MEMORY RETRIEVAL FUNCTION
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_memories_v2(
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    filter_persona uuid,
    filter_user text
)
RETURNS TABLE (
    content text,
    similarity float,
    created_at timestamptz,
    adjusted_score float,
    importance int,
    emotion text
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.content,
        1 - (m.embedding <=> query_embedding) AS similarity,
        m.created_at,
        -- Time decay formula: loses 10% relevance per month
        (1 - (m.embedding <=> query_embedding)) * 
        (1 - LEAST(0.9, (EXTRACT(EPOCH FROM (NOW() - m.created_at)) / 2592000) * 0.1)) *
        (m.importance / 10.0) AS adjusted_score,
        m.importance,
        m.emotion
    FROM memories m
    WHERE m.persona_id = filter_persona
        AND m.user_id = filter_user
        AND 1 - (m.embedding <=> query_embedding) > match_threshold
        AND m.embedding IS NOT NULL
    ORDER BY adjusted_score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- 6. RELATIONSHIP TRACKING TABLE (Optional)
-- ─────────────────────────────────────────────────────────────
-- This table can track relationship milestones
CREATE TABLE IF NOT EXISTS relationship_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    milestone TEXT NOT NULL CHECK (milestone IN (
        'STRANGER', 'ACQUAINTANCE', 'FRIEND', 
        'CLOSE_FRIEND', 'BEST_FRIEND', 'SOULMATE'
    )),
    message_count INTEGER NOT NULL,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, persona_id, milestone)
);

CREATE INDEX IF NOT EXISTS idx_milestones_user_persona 
    ON relationship_milestones(user_id, persona_id);

-- ─────────────────────────────────────────────────────────────
-- 7. ANALYTICS & MONITORING (Optional but Recommended)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    session_duration_seconds INTEGER,
    messages_exchanged INTEGER,
    tokens_consumed INTEGER,
    cost_estimate DECIMAL(10, 4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_persona ON usage_analytics(persona_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON usage_analytics(created_at);

-- ─────────────────────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY (CRITICAL FOR PRODUCTION)
-- ─────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_milestones ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own limits" 
    ON user_limits FOR SELECT 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own access" 
    ON persona_access FOR SELECT 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own facts" 
    ON shared_facts FOR ALL 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can view own milestones" 
    ON relationship_milestones FOR SELECT 
    USING (user_id = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────
-- 9. HELPER VIEWS (FOR DASHBOARDS/ANALYTICS)
-- ─────────────────────────────────────────────────────────────

-- View: User engagement summary
CREATE OR REPLACE VIEW user_engagement AS
SELECT 
    m.user_id,
    m.persona_id,
    p.name AS persona_name,
    COUNT(*) AS total_messages,
    MAX(m.created_at) AS last_interaction,
    AVG(m.importance) AS avg_importance
FROM memories m
JOIN personas p ON m.persona_id = p.id
GROUP BY m.user_id, m.persona_id, p.name;

-- View: Popular personas
CREATE OR REPLACE VIEW popular_personas AS
SELECT 
    p.id,
    p.name,
    COUNT(DISTINCT m.user_id) AS unique_users,
    COUNT(*) AS total_interactions,
    AVG(m.importance) AS avg_importance
FROM personas p
LEFT JOIN memories m ON p.id = m.persona_id
GROUP BY p.id, p.name
ORDER BY unique_users DESC;

-- ─────────────────────────────────────────────────────────────
-- 10. CLEANUP & MAINTENANCE FUNCTIONS
-- ─────────────────────────────────────────────────────────────

-- Function to archive old memories (older than 1 year)
CREATE OR REPLACE FUNCTION archive_old_memories()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    WITH archived AS (
        DELETE FROM memories
        WHERE created_at < NOW() - INTERVAL '1 year'
            AND importance < 5
        RETURNING *
    )
    SELECT COUNT(*) INTO archived_count FROM archived;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily rate limits (run via cron)
CREATE OR REPLACE FUNCTION reset_daily_limits()
RETURNS VOID AS $$
BEGIN
    UPDATE user_limits
    SET requests_today = 0,
        last_reset = NOW()
    WHERE DATE(last_reset) < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- DEPLOYMENT CHECKLIST
-- ═══════════════════════════════════════════════════════════════
-- [ ] Run all CREATE TABLE statements
-- [ ] Run all ALTER TABLE statements
-- [ ] Create all functions
-- [ ] Enable RLS policies
-- [ ] Create indexes
-- [ ] Set up cron job for reset_daily_limits() (runs daily at midnight)
-- [ ] Test with sample data
-- [ ] Monitor query performance
-- ═══════════════════════════════════════════════════════════════