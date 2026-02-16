
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumnTypes() {
    console.log('Checking column types for memories and persona_lockets...');

    // We can query information_schema if we have permissions
    const { data: cols, error } = await supabase.rpc('get_table_columns', { t_name: 'memories' });
    // If RPC doesn't exist, we can try a trick: insert a wrong type and see the error? No, let's try to query a system view if allowed.

    // Or just look at the migration again:
    // CREATE TABLE IF NOT EXISTS persona_lockets (
    //     persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,

    // The migration for memories was additive, but the base table probably has UUIDs.
    // Let's check a record from memories again and look at the persona_id value.
}

async function inspectRecord() {
    const { data, error } = await supabase.from('memories').select('persona_id').limit(1);
    if (data && data.length > 0) {
        console.log('Persona ID value from memories table:', data[0].persona_id);
        console.log('Type of persona_id value:', typeof data[0].persona_id);
    }

    const { data: testRec, error: testErr } = await supabase.from('memories')
        .select('*')
        .eq('user_id', 'sosu_main')
        .limit(1);

    if (testRec && testRec.length > 0) {
        console.log('Test record found:', testRec[0]);
    } else {
        console.log('Test record with user_id "sosu_main" NOT FOUND.');
    }
}

inspectRecord().catch(console.error);
