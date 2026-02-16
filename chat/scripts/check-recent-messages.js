
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessages() {
    const workspaceId = 'ac5edd6c-7dcc-465a-bd8f-d4a5d592589d';
    const personaId = '5720a26f-a61b-4641-ac19-d3a7b01c8bc8';

    console.log(`--- Checking messages for Persona ${personaId} ---`);

    // We need to find the chat session first
    const { data: chats } = await supabase
        .from('chats')
        .select('id, name')
        .eq('persona_id', personaId)
        .order('updated_at', { ascending: false })
        .limit(1);

    if (!chats || chats.length === 0) {
        console.log('No chat session found for this persona.');
        return;
    }

    const chatId = chats[0].id;
    console.log(`Found Chat ID: ${chatId}`);

    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching messages:', error.message);
        return;
    }

    messages.forEach(m => {
        console.log(`[${m.role}] ${m.content.substring(0, 100)}...`);
    });
}

checkMessages().catch(console.error);
