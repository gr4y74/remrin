
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProfile() {
    const userId = 'ac5edd6c-7dcc-465a-bd8f-d4a5d592589d';
    console.log('Creating profile for:', userId);

    // Check if exists again to be safe
    const { data: existing } = await supabase.from('profiles').select('id').eq('user_id', userId).single();
    if (existing) {
        console.log('Profile already exists (unexpected).');
        return;
    }

    const { data, error } = await supabase
        .from('profiles')
        .insert({
            user_id: userId,
            has_onboarded: true,
            display_name: 'Sosu',
            username: 'sosu',
            bio: 'Premium User',
            image_url: '',
            image_path: '',
            profile_context: '',
            use_azure_openai: false
        })
        .select();

    if (error) {
        console.error('Error creating profile:', error);
    } else {
        console.log('✅ Profile created successfully:', data);
    }
}

createProfile();
