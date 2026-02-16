
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = '5ee5ae79-01c9-4729-a99c-40dc68a51877';
const PERSONA_ID = '5720a26f-a61b-4641-ac19-d3a7b01c8bc8';

async function finalVerify() {
    console.log('--- Final Fact Layer Verification ---');

    console.log('\n[Shared Facts]');
    const { data: facts } = await supabase.from('shared_facts').select('*').eq('user_id', USER_ID);
    facts.forEach(f => console.log(`- Type: ${f.fact_type}, Content: ${f.content}`));

    console.log('\n[Persona Lockets]');
    const { data: lockets } = await supabase.from('persona_lockets').select('*').eq('persona_id', PERSONA_ID);
    lockets.forEach(l => console.log(`- Content: ${l.content}`));

    console.log('\n[Memories (Factual)]');
    const { data: memories } = await supabase.from('memories')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('persona_id', PERSONA_ID)
        .eq('importance', 10);
    memories.forEach(m => console.log(`- [${m.role}] ${m.content}`));
}

finalVerify().catch(console.error);
