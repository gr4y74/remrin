
-- Enable pg_trgm for full-text and fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for full-text search on content
-- We use to_tsvector for English search
CREATE INDEX IF NOT EXISTS memories_content_search_idx ON memories USING GIN (to_tsvector('english', content));

-- Hybrid Search RPC (Vector + BM25)
-- Note: This is tailored for the 768-dimension vectors we're using with Gemini
CREATE OR REPLACE FUNCTION match_memories_v3(
  query_embedding vector(768),
  query_text text,
  match_threshold float,
  match_count int,
  filter_persona uuid,
  filter_user text
)
RETURNS TABLE (
  id bigint,
  content text,
  created_at timestamptz,
  importance int,
  role text,
  combined_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    SELECT
      m.id,
      m.content,
      m.created_at,
      m.importance,
      m.role,
      1 - (m.embedding <=> query_embedding) AS similarity
    FROM memories m
    WHERE m.persona_id::text = filter_persona::text
      AND m.user_id::text = filter_user::text
      AND m.embedding IS NOT NULL
      AND 1 - (m.embedding <=> query_embedding) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  text_search AS (
    SELECT
      m.id,
      m.content,
      m.created_at,
      m.importance,
      m.role,
      ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', query_text)) AS rank
    FROM memories m
    WHERE m.persona_id::text = filter_persona::text
      AND m.user_id::text = filter_user::text
      AND to_tsvector('english', m.content) @@ plainto_tsquery('english', query_text)
    ORDER BY rank DESC
    LIMIT match_count * 2
  )
  -- Perform Reciprocal Rank Fusion or weighted combination
  -- For now, we'll use a weighted combination of similarity and rank
  -- and take the union of both result sets
  SELECT
    COALESCE(v.id, t.id) as id,
    COALESCE(v.content, t.content) as content,
    COALESCE(v.created_at, t.created_at) as created_at,
    COALESCE(v.importance, t.importance) as importance,
    COALESCE(v.role, t.role) as role,
    (COALESCE(v.similarity, 0) + COALESCE(t.rank, 0)) as combined_score
  FROM vector_search v
  FULL OUTER JOIN text_search t ON v.id = t.id
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;
