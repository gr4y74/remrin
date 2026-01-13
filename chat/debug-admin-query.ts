
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load env vars
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testQuery() {
    console.log('Testing Admin Personas Query...')

    const { data, error } = await supabase
        .from("personas")
        .select(`
        id, 
        name, 
        description, 
        image_url, 
        visibility, 
        is_featured, 
        category, 
        created_at,
        tags,
        persona_stats(
            followers_count,
            total_chats,
            trending_score
        )
    `)
        .limit(5)

    if (error) {
        console.error('QUERY ERROR:', error)
    } else {
        console.log('QUERY SUCCESS. Returned rows:', data?.length)
        if (data && data.length > 0) {
            console.log('First row sample:', JSON.stringify(data[0], null, 2))
        }
    }
}

testQuery()
