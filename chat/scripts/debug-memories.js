
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMemories() {
    console.log('--- Checking for "Aurora-7-Nova" in all records ---');
    const { data: allMatches, error: allErr } = await supabase
        .from('memories')
        .select('*')
        .ilike('content', '%Aurora-7-Nova%');

    if (allErr) console.error('Error fetching all matches:', allErr);
    else {
        console.log(`Found ${allMatches.length} matches in total.`);
        allMatches.forEach(m => {
            console.log('---');
            console.log(`ID: ${m.id}`);
            console.log(`User ID: ${m.user_id}`);
            console.log(`Persona ID: ${m.persona_id}`);
            console.log(`Content: ${m.content}`);
        });
    }

    console.log('\n--- Checking for memories with user_id: "sosu_main" ---');
    const { data: userMatches, error: userErr } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', 'sosu_main');

    if (userErr) console.error('Error fetching user matches:', userErr);
    else {
        console.log(`Found ${userMatches.length} records for user "sosu_main".`);
        userMatches.forEach(m => console.log(`- ID: ${m.id}, Content: ${m.content.substring(0, 50)}...`));
    }

    console.log('\n--- Checking for memories with persona_id: "rem" ---');
    const { data: personaMatches, error: personaErr } = await supabase
        .from('memories')
        .select('*')
        .eq('persona_id', 'rem');

    if (personaErr) console.error('Error fetching persona matches:', personaErr);
    else console.log(`Found ${personaMatches.length} records for persona "rem".`);
}

checkMemories().catch(console.error);
