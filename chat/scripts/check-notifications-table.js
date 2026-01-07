
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTable() {
    console.log('Checking for system_notifications table...');
    // Try to select 1 row. If table missing, throws 404/PGRST error.
    const { data, error } = await supabase.from('system_notifications').select('id').limit(1);

    if (error) {
        if (error.code === '42P01') { // undefined_table
            console.log('❌ Table system_notifications is MISSING.');
        } else {
            console.log('❌ Error accessing table:', error.message);
        }
    } else {
        console.log('✅ Table system_notifications EXISTS.');
    }
}

checkTable();
