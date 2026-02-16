
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findUser() {
    const workspaceId = 'ac5edd6c-7dcc-465a-bd8f-d4a5d592589d';
    console.log(`Searching for workspace ID: ${workspaceId}...`);
    const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('user_id, name')
        .eq('id', workspaceId)
        .single();

    if (error) {
        console.error('Error fetching workspace:', error.message);
        return;
    }

    console.log('Workspace found:');
    console.log(`- User ID: ${workspace.user_id}`);
    console.log(`- Name: ${workspace.name}`);

    // Also check if this user exists in profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', workspace.user_id)
        .single();

    if (profile) {
        console.log(`- Username: ${profile.username}`);
    }
}

findUser().catch(console.error);
