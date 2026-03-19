import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkChatSchema() {
    console.log('🔍 [Schema Check] Checking chats table schema...\n')

    // Query the information_schema to check for title and is_starred columns
    const { data: columns, error } = await supabase
        .rpc('exec_sql', {
            query: `
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'chats'
                AND column_name IN ('title', 'is_starred')
                ORDER BY column_name;
            `
        })

    if (error) {
        console.log('⚠️ Using fallback method to check schema...')
        // Fallback: Try to select these columns
        const { error: selectError } = await supabase
            .from('chats')
            .select('id, title, is_starred')
            .limit(1)

        if (selectError) {
            console.log('❌ Columns do NOT exist:', selectError.message)
            console.log('\n📝 You need to run the migration: 20260218_add_chat_metadata.sql')
            return false
        } else {
            console.log('✅ Columns exist (verified via select)')
            return true
        }
    }

    if (columns && columns.length > 0) {
        console.log('✅ Found columns:')
        columns.forEach((col: any) => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
        })
        return true
    } else {
        console.log('❌ Columns title and is_starred do NOT exist')
        console.log('\n📝 You need to run the migration: 20260218_add_chat_metadata.sql')
        return false
    }
}

async function checkAutoNaming() {
    console.log('\n🔍 [Auto-Naming Check] Checking if chats have descriptive titles...\n')

    const { data: chats } = await supabase
        .from('chats')
        .select('id, name, title, created_at')
        .not('title', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10)

    if (chats && chats.length > 0) {
        console.log(`✅ Found ${chats.length} chats with titles:`)
        chats.forEach((chat: any) => {
            console.log(`  - "${chat.title}" (${chat.name})`)
        })
        return true
    } else {
        console.log('⚠️ No chats with titles found')
        console.log('   This is normal if you haven\'t created new chats after implementing auto-naming')
        return false
    }
}

checkChatSchema().then(async (schemaExists) => {
    if (schemaExists) {
        await checkAutoNaming()
    }
    console.log('\n✅ [Schema Check] Complete')
    process.exit(0)
}).catch(err => {
    console.error('❌ [Schema Check] Fatal error:', err)
    process.exit(1)
})
