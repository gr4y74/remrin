
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
    const userId = '5ee5ae79-01c9-4729-a99c-40dc68a51877';
    console.log(`Checking profile for user ID: ${userId}...`);
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error.message);
        return;
    }

    console.log('Profile found:');
    console.log(`- Username: ${profile.username}`);
    console.log(`- Full Name: ${profile.full_name}`);
}

checkProfile().catch(console.error);
