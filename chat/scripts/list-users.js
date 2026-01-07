
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
    console.log('Listing users...');

    // Use auth.admin to list users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
        console.log(`ID: ${u.id}, Email: ${u.email}, Last Sign In: ${u.last_sign_in_at}`);
    });
}

listUsers();
