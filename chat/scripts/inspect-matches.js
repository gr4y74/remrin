
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectMatches() {
    console.log('--- Inspecting all matches for "Aurora-7-Nova" ---');
    const { data, error } = await supabase
        .from('memories')
        .select('id, role, content, importance, created_at')
        .ilike('content', '%Aurora-7-Nova%')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    data.forEach(m => {
        console.log(`[${m.id}] Role: ${m.role}, Importance: ${m.importance}, Created: ${m.created_at}`);
        console.log(`Content: ${m.content.substring(0, 100)}...\n`);
    });
}

inspectMatches().catch(console.error);
