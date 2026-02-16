
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listProviders() {
    console.log('--- Listing LLM Providers ---');
    const { data: providers, error } = await supabase
        .from('llm_providers')
        .select('*');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    providers.forEach(p => {
        console.log(`- [${p.provider_key}] ${p.name} (Active: ${p.is_active})`);
    });

    console.log('\n--- Checking for API Keys ---');
    const { data: keys } = await supabase
        .from('api_keys')
        .select('provider');

    keys.forEach(k => {
        console.log(`- Key exists for: ${k.provider}`);
    });
}

listProviders().catch(console.error);
