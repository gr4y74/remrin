
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

async function promoteAdmin() {
    console.log('Finding user "sosu"...')

    // Find user by username
    const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('username', 'sosu')
        .single()

    if (userError || !userProfile) {
        console.error('User "sosu" not found:', userError)

        // Fallback: List all users to see valid usernames
        const { data: users } = await supabase.from('user_profiles').select('username, user_id').limit(5)
        console.log('Available users:', users)
        return
    }

    const userId = userProfile.user_id
    console.log(`Found user "sosu" with ID: ${userId}`)

    // Update profiles table
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('user_id', userId)

    if (updateError) {
        console.error('Error updating profile:', updateError)

        // Check if column exists, maybe migration didn't run?
        // In this environment, we can't auto-run migrations easily without user consent or `supabase db push` which might not be configured.
        // I might need to ask user to run SQL or use `run_command` to execute SQL via psql if available, 
        // but typically I rely on the user or the codebase's query capability.

        // Wait, I can execute SQL via supabase-js? No.
        // I can execute SQL via `psql` if I have connection string.
        // Or I can ask user to run the migration.

        return
    }

    console.log('Successfully promoted "sosu" to admin!')
}

promoteAdmin()
