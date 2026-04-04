import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const client = createClient(supabaseUrl, supabaseKey)

async function findBunny() {
    try {
        console.log('Searching for users...')
        // Check user_profiles
        const { data: profiles } = await client.from('user_profiles').select('*')
        const pMatch = profiles?.find(p => 
            p.username?.toLowerCase().includes('bunny') || 
            p.display_name?.toLowerCase().includes('bunny')
        )

        if (pMatch) {
            console.log('Found match in user_profiles:', pMatch)
            return pMatch.user_id
        }

        // Check auth.users
        const { data: { users } } = await client.auth.admin.listUsers()
        const uMatch = users.find(u => 
            u.email?.toLowerCase().includes('bunny') || 
            JSON.stringify(u.user_metadata).toLowerCase().includes('bunny')
        )

        if (uMatch) {
            console.log('Found match in auth.users:', uMatch.email, uMatch.id)
            return uMatch.id
        }

        console.log('No user found with "bunny" in username, display_name, or email.')
        console.log('Total profiles checked:', profiles?.length)
        console.log('Total auth users checked:', users?.length)
    } catch (e: any) {
        console.error('Error:', e.message)
    }
    return null
}

async function run() {
    const userId = await findBunny()
    if (userId) {
        console.log('Upgrading User:', userId)
        const { error } = await client
            .from('wallets')
            .update({ 
                tier: 'titan',
                balance_aether: 50000 
            })
            .eq('user_id', userId)
        
        if (error) console.error('Wallet update error:', error)
        else console.log('Successfully upgraded user to Titan with 50,000 Aether.')
    }
}

run()
