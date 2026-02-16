
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUnfilteredRpc() {
    console.log('--- Testing Unfiltered RPC ---');

    const { data: keyData } = await supabase.from('api_keys').select('api_key').eq('provider', 'google').single();
    const apiKey = keyData.api_key;
    const GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

    const embRes = await fetch(`${GEMINI_EMBEDDING_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: { parts: [{ text: "Aurora-7-Nova" }] },
            outputDimensionality: 768
        })
    });
    const { embedding: { values: queryEmbedding } } = await embRes.json();

    const { data: results, error } = await supabase.rpc('match_memories_v2', {
        query_embedding: queryEmbedding,
        match_threshold: 0.1,
        match_count: 5
    });

    if (error) {
        console.error('Error:', error.message);
        console.error('Details:', error.details);
    } else {
        console.log(`Found ${results.length} results.`);
    }
}

testUnfilteredRpc().catch(console.error);
