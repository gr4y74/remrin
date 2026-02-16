
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyHybridSearch() {
    console.log('--- Phase 1: Hybrid Search Verification ---');

    console.log('0. Fetching Gemini API Key from database...');
    const { data: keyData, error: keyError } = await supabase.from('api_keys').select('api_key').eq('provider', 'google').single();
    if (keyError || !keyData) {
        throw new Error(`Failed to fetch Google API key: ${keyError?.message || 'Key not found'}`);
    }
    const GEMINI_API_KEY = keyData.api_key;
    const GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

    // We'll test specifically for Aurora-7-Nova
    const queryText = "Tell me about Aurora-7-Nova";

    console.log(`1. Generating 768D embedding for: "${queryText}"`);
    const embRes = await fetch(`${GEMINI_EMBEDDING_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: { parts: [{ text: queryText }] },
            outputDimensionality: 768
        })
    });

    if (!embRes.ok) {
        throw new Error(`Embedding failed: ${await embRes.text()}`);
    }

    const { embedding: { values: embedding } } = await embRes.json();
    console.log(`✅ Embedding generated (${embedding.length} dimensions)`);

    console.log('2. Calling match_memories_v3 (Hybrid Search)...');

    // Use the user and persona from the context (Remrin persona usually)
    // Use real IDs from previous semantic RAG verification
    const personaId = '5720a26f-a61b-4641-ac19-d3a7b01c8bc8'; // Rem Rin
    const userId = '5ee5ae79-01c9-4729-a99c-40dc68a51877'; // Test User

    const { data: results, error } = await supabase.rpc('match_memories_v3', {
        query_embedding: embedding,
        query_text: queryText,
        match_threshold: 0.1, // Low threshold for verification
        match_count: 5,
        filter_persona: personaId,
        filter_user: userId
    });

    if (error) {
        console.error('❌ Hybrid Search failed:', error.message);
        process.exit(1);
    }

    console.log(`✅ Hybrid Search returned ${results.length} results.`);
    results.forEach((r, i) => {
        console.log(`   [${i + 1}] Score: ${r.combined_score.toFixed(4)} | Content: ${r.content.substring(0, 80)}...`);
    });

    const foundMatch = results.some(r => r.content.includes("Aurora-7-Nova"));
    if (foundMatch) {
        console.log('\n🌟 SUCCESS: Precise project name "Aurora-7-Nova" was correctly retrieved!');
    } else {
        console.log('\n⚠️ PARTIAL: Search worked, but specific name match not found in top 5. Checking for any matches...');
    }
}

verifyHybridSearch().catch(console.error);
