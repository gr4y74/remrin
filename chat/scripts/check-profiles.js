
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
    const ids = ['ac5edd6c-7dcc-465a-bd8f-d4a5d592589d', '5ee5ae79-01c9-4729-a99c-40dc68a51877'];

    console.log('Checking profiles for:', ids);

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', ids);

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log('Profiles found:', profiles.length);
    profiles.forEach(p => {
        console.log(`User ${p.user_id}: Name="${p.display_name}", Onboarded=${p.has_onboarded}`);
    });

    // Check missing
    const foundIds = profiles.map(p => p.user_id);
    const missing = ids.filter(id => !foundIds.includes(id));
    if (missing.length > 0) {
        console.log('⚠ Missing profiles for:', missing);
    }
}

checkUsers();
