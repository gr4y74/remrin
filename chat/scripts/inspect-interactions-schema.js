
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
    console.log('Inspecting Tables...');

    // Check tables existing
    const tables = ['moments', 'moment_reactions', 'content', 'content_comments', 'content_likes', 'moment_comments', 'moment_likes', 'moment_bookmarks'];

    for (const t of tables) {
        const { error } = await supabase.from(t).select('id').limit(1);
        if (error && error.code === '42P01') {
            console.log(`❌ Table [${t}] DOES NOT EXIST`);
        } else if (error) {
            console.log(`⚠️ Table [${t}] Error: ${error.message}`);
        } else {
            console.log(`✅ Table [${t}] EXISTS`);
        }
    }
}

inspectSchema();
