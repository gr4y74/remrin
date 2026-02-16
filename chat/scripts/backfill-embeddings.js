
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

async function backfill() {
    console.log('--- Starting Embedding Backfill ---');

    // 1. Get Google API key
    const { data: keyData } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('provider', 'google')
        .single();

    if (!keyData?.api_key) {
        console.error('Google API key not found in database.');
        return;
    }
    const apiKey = keyData.api_key;

    // 2. Find records with null embeddings
    const { data: records, error } = await supabase
        .from('memories')
        .select('id, content')
        .is('embedding', null)
        .limit(100); // Process in batches

    if (error) {
        console.error('Error fetching records:', error.message);
        return;
    }

    console.log(`Found ${records.length} records needing embeddings...`);

    for (const record of records) {
        process.stdout.write(`Processing record ${record.id}... `);

        try {
            const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: { parts: [{ text: record.content }] },
                    outputDimensionality: 768
                })
            });

            if (!response.ok) {
                const errBody = await response.text();
                console.log(`Failed (API Error ${response.status}: ${errBody})`);
                continue;
            }

            const resData = await response.json();
            const embedding = resData.embedding?.values;

            if (embedding) {
                const { error: upErr } = await supabase
                    .from('memories')
                    .update({ embedding })
                    .eq('id', record.id);

                if (upErr) console.log(`Failed (Update Error: ${upErr.message})`);
                else console.log('Done!');
            } else {
                console.log('Failed (No embedding in response)');
            }
        } catch (e) {
            console.log(`Failed (Exception: ${e.message})`);
        }
    }

    console.log('\n--- Backfill Batch Complete ---');
}

backfill().catch(console.error);
