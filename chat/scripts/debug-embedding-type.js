
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEmbedding() {
    const { data: fact } = await supabase
        .from('memories')
        .select('id, embedding')
        .ilike('content', '%Aurora-7-Nova%')
        .limit(1)
        .single();

    if (fact && fact.embedding) {
        console.log('Type of embedding:', typeof fact.embedding);
        console.log('Is Array:', Array.isArray(fact.embedding));
        console.log('Length:', fact.embedding.length);
        if (typeof fact.embedding === 'string') {
            console.log('First 50 chars:', fact.embedding.substring(0, 50));
        } else if (Array.isArray(fact.embedding)) {
            console.log('First 5 elements:', fact.embedding.slice(0, 5));
        }
    }
}

debugEmbedding().catch(console.error);
