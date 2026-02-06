// Script to sync username between tables
// Run with: npx tsx scripts/sync-username.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const SOSU_USER_ID = '5ee5ae79-01c9-4729-a99c-40dc68a51877'

async function main() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Syncing username to "sosu" in user_profiles...')

    // Update user_profiles to use 'sosu' as username (matching URL)
    const { data, error } = await supabase
        .from('user_profiles')
        .update({ username: 'sosu' })
        .eq('user_id', SOSU_USER_ID)
        .select('username')
        .single()

    if (error) {
        console.error('Error:', error.message)
        return
    }

    console.log('Updated username to:', data?.username)
    console.log('Done! Profile should now load correctly at /profile/sosu')
}

main()
