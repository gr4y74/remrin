    -- Drop existing match_memories function if it exists (handles all overloads)
    DROP FUNCTION IF EXISTS match_memories;
    DROP FUNCTION IF EXISTS match_memories(vector, uuid, uuid, float, int);

    -- Create semantic memory search function using pgvector
    -- This function searches for the most semantically similar memories to a query embedding

    CREATE OR REPLACE FUNCTION match_memories(
        query_embedding vector(1536),
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
            memories.id,
            memories.user_id,
            memories.persona_id,
            memories.role,
            memories.content,
            memories.created_at,
            memories.importance,
            memories.domain,
            1 - (memories.embedding <=> query_embedding) as similarity
        FROM memories
        WHERE memories.user_id = match_user_id
            AND memories.persona_id = match_persona_id
            AND 1 - (memories.embedding <=> query_embedding) > match_threshold
        ORDER BY memories.embedding <=> query_embedding
        LIMIT match_count;
    END;
    $$;

    -- Create index for faster similarity search
    CREATE INDEX IF NOT EXISTS memories_embedding_idx 
    ON memories 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

    -- Add comment to explain the function
    COMMENT ON FUNCTION match_memories IS 'Semantic search for memories using cosine similarity. Returns memories most similar to the query embedding, filtered by user_id and persona_id.';
