import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseChatHistory() {
    console.log('🔍 [Diagnostic] Querying all chats...\n')

    // 1. Get all chats
    const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id, name, created_at, updated_at, user_id')
        .order('created_at', { ascending: false })
        .limit(50)

    if (chatsError) {
        console.error('❌ [Diagnostic] Failed to fetch chats:', chatsError)
        return
    }

    console.log(`✅ [Diagnostic] Found ${chats?.length || 0} chats\n`)

    if (!chats || chats.length === 0) {
        console.log('⚠️ [Diagnostic] No chats found in database.')
        return
    }

    // 2. Display chat summary
    for (const chat of chats) {
        console.log(`📁 Chat: ${chat.name}`)
        console.log(`   ID: ${chat.id}`)
        console.log(`   Created: ${chat.created_at}`)
        console.log(`   User ID: ${chat.user_id}`)

        // Get message count for this chat
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)

        console.log(`   Messages: ${count || 0}`)
        console.log('')
    }

    // 3. Get a sample of recent messages
    console.log('\n📨 [Diagnostic] Recent messages (last 10):\n')
    const { data: recentMessages } = await supabase
        .from('messages')
        .select('chat_id, role, content, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

    if (recentMessages) {
        for (const msg of recentMessages) {
            console.log(`[${msg.created_at}] ${msg.role}: ${msg.content.substring(0, 80)}...`)
            console.log(`   Chat ID: ${msg.chat_id}\n`)
        }
    }
}

diagnoseChatHistory().then(() => {
    console.log('✅ [Diagnostic] Complete')
    process.exit(0)
}).catch(err => {
    console.error('❌ [Diagnostic] Fatal error:', err)
    process.exit(1)
})
