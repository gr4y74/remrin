// Diagnostic script to check profile and persona data
// Run with: npx tsx scripts/check-profile-data.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const SOSU_USER_ID = '5ee5ae79-01c9-4729-a99c-40dc68a51877'

async function main() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('=== Checking Profile Data for Sosu ===\n')

    // Check user_profiles table
    console.log('1. user_profiles table:')
    const { data: userProfile, error: upError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', SOSU_USER_ID)
        .single()

    if (upError) {
        console.log('   ERROR:', upError.message)
    } else if (userProfile) {
        console.log('   Found user_profile:')
        console.log('   - username:', userProfile.username)
        console.log('   - display_name:', userProfile.display_name)
        console.log('   - location:', userProfile.location)
        console.log('   - website_url:', userProfile.website_url)
        console.log('   - bio:', userProfile.bio?.substring(0, 50) || '(empty)')
        console.log('   - banner_url:', userProfile.banner_url || '(empty)')
        console.log('   - hero_image_url:', userProfile.hero_image_url?.substring(0, 50) || '(empty)')
    } else {
        console.log('   No user_profile found!')
    }

    // Check profiles table (legacy)
    console.log('\n2. profiles table (legacy):')
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', SOSU_USER_ID)
        .single()

    if (pError) {
        console.log('   ERROR:', pError.message)
    } else if (profile) {
        console.log('   Found profile:')
        console.log('   - username:', profile.username)
        console.log('   - display_name:', profile.display_name)
        console.log('   - image_url:', profile.image_url?.substring(0, 50) || '(empty)')
    } else {
        console.log('   No profile found!')
    }

    // Check personas by creator_id
    console.log('\n3. Personas with creator_id = sosu:')
    const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select('id, name, creator_id')
        .eq('creator_id', SOSU_USER_ID)

    if (personasError) {
        console.log('   ERROR:', personasError.message)
    } else {
        console.log(`   Found ${personas?.length || 0} personas:`)
        personas?.slice(0, 5).forEach(p => console.log(`   - ${p.name}`))
        if ((personas?.length || 0) > 5) {
            console.log(`   ... and ${(personas?.length || 0) - 5} more`)
        }
    }

    // Check persona count by visibility
    console.log('\n4. Persona visibility:')
    const { data: visibilityData } = await supabase
        .from('personas')
        .select('visibility')
        .eq('creator_id', SOSU_USER_ID)

    const visibilityCount: Record<string, number> = {}
    visibilityData?.forEach(p => {
        const v = p.visibility || 'null'
        visibilityCount[v] = (visibilityCount[v] || 0) + 1
    })
    Object.entries(visibilityCount).forEach(([v, count]) => {
        console.log(`   - ${v}: ${count}`)
    })

    console.log('\n=== Done ===')
}

main()
