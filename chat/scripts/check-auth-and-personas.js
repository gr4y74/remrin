
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuth() {
    console.log('--- Checking Authenticated User ---');

    // In a real API context, we'd get this from supabase.auth.getUser()
    // Here we check if the user 5ee5ae79 exists in auth.users
    const { data: { user }, error } = await supabase.auth.admin.getUserById('5ee5ae79-01c9-4729-a99c-40dc68a51877');

    if (error) {
        console.error('Error fetching auth user 5ee5ae79:', error.message);
    } else if (user) {
        console.log('User 5ee5ae79 found in auth.users:', user.email);
    } else {
        console.log('User 5ee5ae79 NOT FOUND in auth.users.');
    }

    // List all personas to see if there's another Rem Rin
    console.log('\n--- Listing All Personas named "Rem Rin" ---');
    const { data: personas } = await supabase
        .from('personas')
        .select('*')
        .ilike('name', '%Rem Rin%');

    personas.forEach(p => {
        console.log(`- ID: ${p.id}, Name: ${p.name}, Owner: ${p.owner_id}`);
    });
}

checkAuth().catch(console.error);
