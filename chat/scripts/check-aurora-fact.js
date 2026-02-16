
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFact() {
    console.log('--- Checking "Aurora-7-Nova" Fact ---');
    const { data: fact, error } = await supabase
        .from('memories')
        .select('id, content, embedding, user_id, persona_id')
        .ilike('content', '%Aurora-7-Nova%')
        .limit(1)
        .single();

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`ID: ${fact.id}`);
    console.log(`Content: ${fact.content}`);
    console.log(`User ID: ${fact.user_id}`);
    console.log(`Persona ID: ${fact.persona_id}`);
    console.log(`Embedding exists: ${!!fact.embedding}`);
    if (fact.embedding) {
        console.log(`Embedding dimension: ${fact.embedding.length}`);
    } else {
        console.log('Fact is missing an embedding. Backfilling now...');
        const fetch = require('node-fetch');
        const { data: keyData } = await supabase.from('api_keys').select('api_key').eq('provider', 'google').single();
        const apiKey = keyData.api_key;
        const GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

        const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: { parts: [{ text: fact.content }] },
                outputDimensionality: 768
            })
        });

        if (response.ok) {
            const resData = await response.json();
            const embedding = resData.embedding?.values;
            if (embedding) {
                const { error: upErr } = await supabase.from('memories').update({ embedding }).eq('id', fact.id);
                if (!upErr) console.log('✅ Backfilled successfully!');
                else console.log('❌ Update failed:', upErr.message);
            }
        } else {
            console.log('❌ API Call failed:', await response.text());
        }
    }
}

checkFact().catch(console.error);
