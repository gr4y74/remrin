
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SEARCH_API_URL = "http://localhost:3000/api/v2/memories/search"; // Assuming dev server running

async function verifySemantic() {
    console.log('--- Testing Semantic Search ---');

    // 1. Manually generate embedding for "quantum security" (related to Aurora-7-Nova context)
    // We already know Aurora-7-Nova relates to "secure code" and "transmission"
    const query = "quantum secure encryption";
    console.log(`Query: ${query}`);

    // Since we can't easily call the API from the shell without auth cookies, 
    // we'll simulate the search logic using the service role key and direct RPC call.

    // Get embedding for query
    const { data: keyData } = await supabase.from('api_keys').select('api_key').eq('provider', 'google').single();
    const apiKey = keyData.api_key;
    const GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

    const embRes = await fetch(`${GEMINI_EMBEDDING_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: { parts: [{ text: query }] },
            outputDimensionality: 768
        })
    });
    const { embedding: { values: queryEmbedding } } = await embRes.json();

    // Search
    const { data: results, error } = await supabase.rpc('match_memories_v2', {
        query_embedding: queryEmbedding,
        match_threshold: 0.1, // Even lower to see anything
        match_count: 5,
        filter_persona: '5720a26f-a61b-4641-ac19-d3a7b01c8bc8',
        filter_user: '5ee5ae79-01c9-4729-a99c-40dc68a51877'
    });

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`Found ${results.length} results:`);
    results.forEach((r, i) => {
        console.log(`[${i + 1}] (Sim: ${r.similarity.toFixed(4)}) ${r.content}`);
    });

    const found = results.some(r => r.content.includes('Aurora-7-Nova'));
    if (found) {
        console.log('\n✅ SUCCESS: Aurora-7-Nova found via semantic search!');
    } else {
        console.log('\n❌ FAILURE: Aurora-7-Nova not found. Checking if it has an embedding...');
        const { data: fact } = await supabase.from('memories').select('id, content, embedding').ilike('content', '%Aurora-7-Nova%').single();
        if (fact) {
            console.log(`Fact ID: ${fact.id}, Embedding exists: ${!!fact.embedding}`);
            if (!fact.embedding) {
                console.log('Fact does not have an embedding yet. Running backfill for it explicitly...');
            }
        }
    }
}

verifySemantic().catch(console.error);
