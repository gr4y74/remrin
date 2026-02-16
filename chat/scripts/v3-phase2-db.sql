-- ═══════════════════════════════════════════════════════════════
-- UNIVERSAL CONSOLE V3 - PHASE 2: THE BRAIN LAYER
-- ═══════════════════════════════════════════════════════════════

-- 1. Create the Structured Graph Table
CREATE TABLE IF NOT EXISTS user_profile_graph (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'person', 'place', 'event', 'fact', 'preference'
    data JSONB DEFAULT '{}',
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entity_name, entity_type)
);

-- 2. Create indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_graph_user_entity ON user_profile_graph(user_id, entity_name);
CREATE INDEX IF NOT EXISTS idx_graph_type ON user_profile_graph(entity_type);

-- 3. Trigger to update last_updated
CREATE OR REPLACE FUNCTION update_graph_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_graph_time ON user_profile_graph;
CREATE TRIGGER tr_update_graph_time
    BEFORE UPDATE ON user_profile_graph
    FOR EACH ROW
    EXECUTE FUNCTION update_graph_timestamp();

-- 4. Enable RLS
ALTER TABLE user_profile_graph ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own graph" ON user_profile_graph;
CREATE POLICY "Users can manage their own graph"
    ON user_profile_graph
    FOR ALL
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);
