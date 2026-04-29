-- Phase 4: Directive Layer
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS directives JSONB DEFAULT '[]'::jsonb;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS directives JSONB DEFAULT NULL; -- Null means use tenant default

-- Phase 5: Locket -> RAG
-- Ensure pgvector extension is enabled (already likely is, but safe to check)
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE persona_lockets ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Update match_memories_v4 to include lockets
CREATE OR REPLACE FUNCTION match_memories_v4(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_persona uuid,
  filter_user uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  source text,
  created_at timestamptz,
  role text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH combined_results AS (
    -- Memories
    SELECT 
      m.id, 
      m.content, 
      1 - (m.embedding <=> query_embedding) as similarity,
      'memory' as source,
      m.created_at,
      m.role
    FROM memories m
    WHERE m.persona_id = filter_persona
      AND m.user_id = filter_user
      AND 1 - (m.embedding <=> query_embedding) > match_threshold
    
    UNION ALL
    
    -- Lockets (Boosted by adding 0.2 to similarity, capped at 1.0)
    SELECT 
      l.id, 
      l.content, 
      LEAST(1.0, (1 - (l.embedding <=> query_embedding)) + 0.2) as similarity,
      'locket' as source,
      l.created_at,
      'assistant' as role -- Lockets are truths from the assistant perspective or ground truth
    FROM persona_lockets l
    WHERE l.persona_id = filter_persona
      AND 1 - (l.embedding <=> query_embedding) > match_threshold
  )
  SELECT * FROM combined_results
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
