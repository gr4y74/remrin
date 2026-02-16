
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColType() {
    const { data, error } = await supabase.rpc('get_column_info_v2', {}, {
        // We'll try to run a custom query if possible or use a known RPC
    });

    // Since I don't know the RPCs, I'll use a direct query via a 'query' RPC if it exists, 
    // or just use the memories table again and check the metadata if supabase-js provides it.

    // Actually, I'll use a trick: try to insert a non-vector and see the error.
    console.log('--- Checking Column Type via Error Message ---');
    const { error: err } = await supabase.from('memories').insert({
        content: 'test_type_check',
        user_id: '5ee5ae79-01c9-4729-a99c-40dc68a51877',
        persona_id: '5720a26f-a61b-4641-ac19-d3a7b01c8bc8',
        embedding: [1, 2, 3] // This should fail if it expects 768 dimensions
    });

    if (err) {
        console.log('Error Message:', err.message);
        console.log('Error Code:', err.code);
        console.log('Error Details:', err.details);
    } else {
        console.log('No error - column might be flexible or type matches.');
    }
}

checkColType().catch(console.error);
