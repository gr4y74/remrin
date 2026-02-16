
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDim() {
    const { data: keyData } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('provider', 'google')
        .single();

    if (!keyData?.api_key) return;
    const apiKey = keyData.api_key;

    const GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

    const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: { parts: [{ text: "Hello world" }] }
        })
    });

    const data = await response.json();
    console.log('Embedding Dimension:', data.embedding?.values?.length);
}

checkDim().catch(console.error);
