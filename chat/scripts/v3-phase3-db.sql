-- ═══════════════════════════════════════════════════════════════
-- UNIVERSAL CONSOLE V3 - PHASE 3: THE STORY LAYER
-- ═══════════════════════════════════════════════════════════════

-- 1. Create the Episodes Table
-- This groups memories into "Scenes" to provide narrative context.
CREATE TABLE IF NOT EXISTS memories_episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    persona_id UUID NOT NULL,
    topic_summary TEXT NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}', -- Store emotional arc, confidence, etc.
    embedding vector(768) -- Topic-level embedding for "Lazy RAG"
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_episodes_user_persona ON memories_episodes(user_id, persona_id);
CREATE INDEX IF NOT EXISTS idx_episodes_embedding ON memories_episodes USING ivfflat (embedding vector_cosine_ops);

-- 3. Link memories to episodes (Optional but recommended for strict grouping)
ALTER TABLE memories ADD COLUMN IF NOT EXISTS episode_id UUID REFERENCES memories_episodes(id);

-- 4. Enable RLS
ALTER TABLE memories_episodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own episodes" ON memories_episodes;
CREATE POLICY "Users can manage their own episodes"
    ON memories_episodes
    FOR ALL
    USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);
