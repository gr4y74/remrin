
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = '5ee5ae79-01c9-4729-a99c-40dc68a51877';
const PERSONA_ID = '5720a26f-a61b-4641-ac19-d3a7b01c8bc8';
const FACT_CONTENT = 'The secret code for the quantum encryption project is "Aurora-7-Nova". This is a critical security fact.';

async function injectEverywhere() {
    console.log('--- Multi-Layered Fact Injection ---');

    // 1. Shared Facts (User Identity Layer)
    console.log('1. Adding to shared_facts...');
    const { error: fErr } = await supabase.from('shared_facts').insert({
        user_id: USER_ID,
        fact_type: 'IDENTITY',
        content: FACT_CONTENT,
        shared_with_all: true,
        importance: 10
    });
    if (fErr) console.error('Error adding to shared_facts:', fErr.message);
    else console.log('✅ Added to shared_facts.');

    // 2. Persona Lockets (Immutable Truths Layer)
    console.log('2. Adding to persona_lockets...');
    const { error: lErr } = await supabase.from('persona_lockets').insert({
        persona_id: PERSONA_ID,
        content: `Long-term memory test: ${FACT_CONTENT}`
    });
    if (lErr) console.error('Error adding to persona_lockets:', lErr.message);
    else console.log('✅ Added to persona_lockets.');

    // 3. Memories (Factual Context Layer) - with extra keywords
    console.log('3. Adding to memories with enhanced keywords...');
    const { error: mErr } = await supabase.from('memories').insert({
        user_id: USER_ID,
        persona_id: PERSONA_ID,
        role: 'user',
        content: FACT_CONTENT + ' Keywords: Aurora-7-Nova, secret code, quantum encryption.',
        importance: 10,
        domain: 'personal'
    });
    if (mErr) console.error('Error adding to memories:', mErr.message);
    else console.log('✅ Added to memories.');

    console.log('\nInjection Complete. Rem Rin should now KNOW this fact via 3 different layers.');
}

injectEverywhere().catch(console.error);
