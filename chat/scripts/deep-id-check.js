
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepCheck() {
    const ids = [
        '5ee5ae79-01c9-4729-a99c-40dc68a51877',
        'ac5edd6c-7dcc-465a-bd8f-d4a5d592589d'
    ];

    for (const id of ids) {
        console.log(`\n=== Checking ID: ${id} ===`);

        // 1. Auth check
        const { data, error: uErr } = await supabase.auth.admin.getUserById(id);
        if (data && data.user) {
            console.log('Auth User:', {
                email: data.user.email,
                id: data.user.id,
                created_at: data.user.created_at
            });
        } else {
            console.log('Not in auth.users.');
        }

        // 2. Profile check
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', id)
            .maybeSingle();

        if (profile) {
            console.log('Profile:', {
                username: profile.username,
                user_id: profile.user_id
            });
        } else {
            console.log('No profile found.');
        }

        // 3. Workspace check
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (workspace) {
            console.log('Workspace:', {
                name: workspace.name,
                user_id: workspace.user_id,
                id: workspace.id
            });
        } else {
            console.log('Not a workspace ID.');
        }
    }
}

deepCheck().catch(console.error);
