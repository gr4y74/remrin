
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllModels() {
    const { data: keyData } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('provider', 'google')
        .single();

    if (!keyData?.api_key) return;
    const apiKey = keyData.api_key;

    const models = ['models/gemini-embedding-001', 'models/text-embedding-004'];

    for (const m of models) {
        console.log(`Checking model: ${m}...`);
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${m}:embedContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: { parts: [{ text: "Hello world" }] }
                })
            });

            if (!response.ok) {
                console.log(`- Failed: ${response.status}`);
                continue;
            }

            const data = await response.json();
            console.log(`- Dimension: ${data.embedding?.values?.length}`);

            // Try with dimensionality if not 768
            if (data.embedding?.values?.length !== 768) {
                console.log(`- Attempting with outputDimensionality: 768...`);
                const response2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/${m}:embedContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: { parts: [{ text: "Hello world" }] },
                        outputDimensionality: 768
                    })
                });
                if (response2.ok) {
                    const data2 = await response2.json();
                    console.log(`  - Success! Dimension: ${data2.embedding?.values?.length}`);
                } else {
                    console.log(`  - Failed: ${response2.status}`);
                }
            }
        } catch (e) {
            console.log(`- Error: ${e.message}`);
        }
    }
}

checkAllModels().catch(console.error);
