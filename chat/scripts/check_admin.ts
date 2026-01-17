
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAdmins() {
    console.log('Checking profiles for admin users...')

    // Get all profiles with user details
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, is_admin, tier')

    if (error) {
        console.error('Error fetching profiles:', error)
        return
    }

    console.log(`Found ${profiles.length} profiles:`)

    for (const profile of profiles) {
        // Determine username from user_profiles if possible, or just print ID
        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('username, display_name')
            .eq('user_id', profile.user_id)
            .single()

        console.log(`- User: ${userProfile?.username || profile.user_id} | Admin: ${profile.is_admin} | Tier: ${profile.tier}`)
    }
}

checkAdmins()
