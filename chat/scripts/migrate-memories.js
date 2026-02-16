
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const REAL_USER_ID = '5ee5ae79-01c9-4729-a99c-40dc68a51877';
const REAL_PERSONA_ID = '5720a26f-a61b-4641-ac19-d3a7b01c8bc8';

async function migrate() {
    console.log('--- Migrating Orphaned Memories ---');

    console.log('1. Migrating persona_id "rem" -> UUID...');
    const { count: pCount, error: pError } = await supabase
        .from('memories')
        .update({ persona_id: REAL_PERSONA_ID })
        .eq('persona_id', 'rem');

    if (pError) console.error('Error migrating persona IDs:', pError.message);
    else console.log(`Migrated persona IDs for some records.`);

    console.log('2. Migrating user_id "sosu_main" -> UUID...');
    const { count: uCount, error: uError } = await supabase
        .from('memories')
        .update({ user_id: REAL_USER_ID })
        .eq('user_id', 'sosu_main');

    if (uError) console.error('Error migrating user IDs:', uError.message);
    else console.log(`Migrated user IDs for some records.`);

    console.log('\nMigration complete.');
}

migrate().catch(console.error);
