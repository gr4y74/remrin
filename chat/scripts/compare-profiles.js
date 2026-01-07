
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
    console.log('Comparing [profiles] vs [user_profiles]...');

    // 1. Check Profiles
    const { data: profiles, error: err1 } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    // 2. Check User Profiles
    const { data: userProfiles, error: err2 } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });

    console.log(`profiles count: ${profiles?.length ?? 'N/A'} (Error: ${err1?.message})`);
    console.log(`user_profiles count: ${userProfiles?.length ?? 'N/A'} (Error: ${err2?.message})`);

    // 3. Check failing user in user_profiles
    const userId = '5ee5ae79-01c9-4729-a99c-40dc68a51877';
    const { data: pData } = await supabase.from('profiles').select('*').eq('user_id', userId);
    const { data: upData } = await supabase.from('user_profiles').select('*').eq('id', userId); // Assuming PK is id match

    console.log('User in profiles:', pData?.length > 0 ? 'YES' : 'NO');
    console.log('User in user_profiles:', upData?.length > 0 ? 'YES' : 'NO');
}

checkTables();
