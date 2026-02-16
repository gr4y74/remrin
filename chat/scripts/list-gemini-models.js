
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listModels() {
    const { data: keyData } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('provider', 'google')
        .single();

    if (!keyData?.api_key) return;
    const apiKey = keyData.api_key;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    console.log('Available Models:');
    data.models.forEach(m => {
        if (m.supportedGenerationMethods.includes('embedContent')) {
            console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
        }
    });
}

listModels().catch(console.error);
