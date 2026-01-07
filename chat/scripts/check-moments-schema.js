
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log('Verifying moments table schema...');

    // Access via admin api? No, just try to select columns or insert dummy?
    // We can infer columns by selecting 1 row with *

    // Better: Try to insert a dummy row that is invalid but exercises columns, catch error?
    // Or just check if columns exist by selecting NULLs?

    // Let's use metadata query if possible?
    // Supabase JS doesn't expose meta easily.

    // I'll try to insert a VALID dummy row matching the code.
    // If it fails, I'll log the error.

    const dummyUser = '5ee5ae79-01c9-4729-a99c-40dc68a51877'; // Remrin
    const dummyPersona = '932ccbb4-a07d-46c4-9c44-2560f2eb4e8a'; // A persona ID from user request

    const payload = {
        persona_id: dummyPersona,
        created_by_user_id: dummyUser,
        media_type: 'video',
        caption: 'Schema Test',
        video_url: 'http://test.com/video.mp4',
        thumbnail_url: 'http://test.com/thumb.jpg',
        duration_seconds: 10,
        reactions_summary: {}
    };

    console.log('Attempting insert with:', payload);

    const { data, error } = await supabase.from('moments').insert(payload).select();

    if (error) {
        console.error('❌ Insert Failed:', error);
        // If error is "column "video_url" of relation "moments" does not exist", we know.
    } else {
        console.log('✅ Insert Succeeded (Schema is correct). Deleting test row...');
        if (data && data[0]) {
            await supabase.from('moments').delete().eq('id', data[0].id);
        }
    }
}

checkSchema();
