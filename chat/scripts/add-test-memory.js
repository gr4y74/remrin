/**
 * Add a test memory to the memories table
 * This allows testing deep memory retrieval functionality
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestMemory() {
    console.log('--- Adding Test Memory to Database ---\n');

    const testMemory = {
        user_id: 'sosu_main',  // Your user ID
        persona_id: 'rem',      // Rem's persona ID
        role: 'user',
        content: 'Test memory: The secret code for the quantum encryption project is "Aurora-7-Nova". This was discussed during our late-night debugging session.',
        domain: 'personal',
        importance: 8,
        emotion: 'focused',
        tags: ['testing', 'quantum', 'project'],
        metadata: {
            test: true,
            injected_at: new Date().toISOString()
        }
    };

    console.log('Inserting memory:', JSON.stringify(testMemory, null, 2));

    const { data, error } = await supabase
        .from('memories')
        .insert([testMemory])
        .select();

    if (error) {
        console.error('❌ Error inserting memory:', error);
        return;
    }

    console.log('\n✅ Test memory added successfully!');
    console.log('Memory ID:', data[0]?.id);
    console.log('\nNow you can ask Rem:');
    console.log('  "What is the quantum encryption code?"');
    console.log('  "Do you remember our late-night debugging session?"');
    console.log('  "Tell me about Aurora-7-Nova"');
}

addTestMemory().catch(console.error);
