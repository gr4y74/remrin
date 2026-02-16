
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = '5ee5ae79-01c9-4729-a99c-40dc68a51877';
const PERSONA_ID = '5720a26f-a61b-4641-ac19-d3a7b01c8bc8';

async function verifySearch(query) {
    console.log(`--- Verifying Search for: "${query}" ---`);

    const keywords = query.split(/\s+/).filter((k) => k.length > 2);
    console.log('Keywords:', keywords);

    let memoryQuery = supabase
        .from('memories')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('persona_id', PERSONA_ID)
        .order('importance', { ascending: false })
        .order('created_at', { ascending: false })
        .not('role', 'eq', 'assistant');

    if (keywords.length > 0) {
        const filters = keywords.map((k) => `content.ilike.%${k}%`).join(',');
        memoryQuery = memoryQuery.or(filters);
    } else {
        memoryQuery = memoryQuery.ilike('content', `%${query}%`);
    }

    const { data: memories, error } = await memoryQuery;

    if (error) {
        console.error('❌ Error searching memories:', error.message);
        return;
    }

    console.log(`✅ Found ${memories.length} matches.`);
    memories.forEach(m => {
        console.log(`- [${m.id}] ${m.content.substring(0, 100)}...`);
    });
}

async function runTests() {
    await verifySearch('Aurora-7-Nova');
    await verifySearch('quantum encryption');
}

runTests().catch(console.error);
