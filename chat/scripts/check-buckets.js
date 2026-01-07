
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBuckets() {
    console.log('Checking Storage Buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    const required = ['moment-images', 'moment-videos', 'moment-thumbnails'];
    const found = buckets.map(b => b.name);

    console.log('Existing buckets:', found);

    const missing = required.filter(r => !found.includes(r));
    if (missing.length > 0) {
        console.log('❌ MISSING BUCKETS:', missing);

        // Try creating them?
        for (const bucket of missing) {
            console.log(`Creating bucket: ${bucket}...`);
            const { error: createError } = await supabase.storage.createBucket(bucket, {
                public: true,
                fileSizeLimit: 52428800, // 50MB
                allowedMimeTypes: bucket === 'moment-videos' ? ['video/*'] : ['image/*']
            });
            if (createError) console.error(`  Error creating ${bucket}:`, createError);
            else console.log(`  ✅ Created ${bucket}`);
        }
    } else {
        console.log('✅ All required buckets exist.');
    }
}

checkBuckets();
