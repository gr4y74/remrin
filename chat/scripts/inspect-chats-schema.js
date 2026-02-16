
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectChats() {
    console.log('--- Inspecting Chats Table ---');
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching chats:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in chats table:', Object.keys(data[0]));
        console.log('Sample record:', data[0]);
    } else {
        console.log('Chats table is empty.');
    }
}

inspectChats().catch(console.error);
