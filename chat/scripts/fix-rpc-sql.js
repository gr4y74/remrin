
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
CREATE OR REPLACE FUNCTION match_memories_v2(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_persona uuid DEFAULT NULL,
    filter_user text DEFAULT NULL
)
RETURNS TABLE (
    id bigint,
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
        m.id,
        m.content,
        (1 - (m.embedding <=> query_embedding))::float AS similarity,
        m.created_at,
        ((1 - (m.embedding <=> query_embedding)) * 
         (1 - LEAST(0.9, (EXTRACT(EPOCH FROM (NOW() - m.created_at)) / 2592000) * 0.1)) *
         (m.importance / 10.0))::float AS adjusted_score,
        m.importance,
        m.emotion
    FROM memories m
    WHERE (filter_persona IS NULL OR m.persona_id = filter_persona)
        AND (filter_user IS NULL OR m.user_id = filter_user)
        AND 1 - (m.embedding <=> query_embedding) > match_threshold
        AND m.embedding IS NOT NULL
    ORDER BY adjusted_score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
`;

async function updateRpc() {
    console.log('--- Updating match_memories_v2 function ---');

    // Check if we can run raw SQL. Supabase doesn't allow raw SQL via its client normally 
    // unless there is a specific 'exec_sql' or similar RPC.
    // I'll check if there is a 'create_function' or 'run_sql' RPC if I can.

    console.log('Attempting to run migration via RPC...');
    // In many of these environments, there's a specialized RPC for this.
    const { error } = await supabase.rpc('exec_sql', { sql: sql });

    if (error) {
        console.error('Error running SQL:', error.message);
        console.log('Note: If exec_sql is missing, you might need to run this in the Supabase Dashboard SQL Editor.');
    } else {
        console.log('✅ Function updated successfully!');
    }
}

updateRpc().catch(console.error);
