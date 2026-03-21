-- ═══════════════════════════════════════════════════════════════
-- SYNC VECTOR DIMENSIONS TO 768 (GEMINI STANDARD)
-- ═══════════════════════════════════════════════════════════════

-- 1. Alter memories table to use 768-dimensional vectors
-- Since the current system is broken, we drop and recreate the column
ALTER TABLE memories DROP COLUMN IF EXISTS embedding;
ALTER TABLE memories ADD COLUMN embedding vector(768);

-- 2. Drop legacy search functions
DROP FUNCTION IF EXISTS match_memories;
DROP FUNCTION IF EXISTS match_memories(vector, uuid, uuid, float, int);
DROP FUNCTION IF EXISTS match_memories_v2;

-- 3. Create unified match_memories (V1 standard)
CREATE OR REPLACE FUNCTION match_memories(
    query_embedding vector(768),
    match_user_id uuid,
    match_persona_id uuid,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    persona_id uuid,
    role text,
    content text,
    created_at timestamptz,
    importance int,
    domain text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.user_id,
        m.persona_id,
        m.role,
        m.content,
        m.created_at,
        m.importance,
        m.domain,
        1 - (m.embedding <=> query_embedding) as similarity
    FROM memories m
    WHERE m.user_id = match_user_id
        AND m.persona_id = match_persona_id
        AND 1 - (m.embedding <=> query_embedding) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 4. Create match_memories_v2 (Universal Console standard with Time Decay)
CREATE OR REPLACE FUNCTION match_memories_v2(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_persona uuid,
    filter_user uuid -- Standardized to uuid
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
        -- Time decay: loses 10% relevance per month (approx 30 days)
        (1 - (m.embedding <=> query_embedding)) * 
        (1 - LEAST(0.9, (EXTRACT(EPOCH FROM (NOW() - m.created_at)) / 2592000) * 0.1)) *
        (COALESCE(m.importance, 5) / 10.0) AS adjusted_score,
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

-- 5. Recreate Index for 768-dimensional vectors
CREATE INDEX IF NOT EXISTS memories_embedding_idx 
ON memories 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- 6. Add comments
COMMENT ON FUNCTION match_memories IS 'Semantic search (768d) for long-term memories.';
COMMENT ON FUNCTION match_memories_v2 IS 'Semantic search (768d) with integrated time-decay and importance weighting.';
