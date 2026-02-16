
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('--- Running Phase 1 Migration ---');

    const sql = fs.readFileSync('scripts/v3-phase1-db.sql', 'utf8');

    // We use our helper exec_sql RPC to run the migration
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }

    console.log('Migration successful!');
}

runMigration();
