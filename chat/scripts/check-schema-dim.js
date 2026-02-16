
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase.rpc('get_column_info', {
        table_name: 'memories',
        column_name: 'embedding'
    });

    if (error) {
        // Fallback: search for a record and check its dimension
        console.log('RPC get_column_info not found, checking existing record...');
        const { data: records } = await supabase
            .from('memories')
            .select('embedding')
            .not('embedding', 'is', null)
            .limit(1);

        if (records && records.length > 0) {
            console.log('Existing record embedding dimension:', records[0].embedding.length);
        } else {
            console.log('No records with embeddings found.');
        }
    } else {
        console.log('Column Info:', data);
    }
}

checkSchema().catch(console.error);
