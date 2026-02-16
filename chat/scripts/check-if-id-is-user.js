
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkId() {
    const id = 'ac5edd6c-7dcc-465a-bd8f-d4a5d592589d';
    console.log(`Checking if ${id} is a user ID...`);

    // Check auth.users
    const { data: user, error: uErr } = await supabase.auth.admin.getUserById(id);
    if (user) {
        console.log('Found as AUTH USER:', user.email);
    } else {
        console.log('Not found in auth.users.');
    }

    // Check profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', id)
        .single();

    if (profile) {
        console.log('Found as PROFILE:', profile.username);
    } else {
        console.log('Not found in profiles.');
    }
}

checkId().catch(console.error);
