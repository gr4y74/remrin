
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
    console.log('Checking policies for persona_lockets and memories...');
    const { data: policies, error } = await supabase.rpc('get_policies', { table_name: 'persona_lockets' });
    // Note: get_policies is not a standard RPC, I might need to query pg_policies directly via a raw query if enabled, 
    // or just assume based on the migration file.

    // Let's try to query pg_policies via a script that runs a raw SQL if possible, 
    // or just check if we can read persona_lockets without filters.

    const { data, error: readError } = await supabase
        .from('persona_lockets')
        .select('*')
        .limit(1);

    if (readError) {
        console.error('Error reading persona_lockets:', readError.message);
    } else {
        console.log('Successfully read persona_lockets (RLS might allow it or we are using service role):', data);
    }
}

checkPolicies().catch(console.error);
