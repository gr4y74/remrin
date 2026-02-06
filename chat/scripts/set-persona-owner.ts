// Quick script to set all personas to be owned by sosu
// Run with: npx tsx scripts/set-persona-owner.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const SOSU_USER_ID = '5ee5ae79-01c9-4729-a99c-40dc68a51877'

async function main() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role to bypass RLS
    )

    // First, let's see how many personas exist
    const { data: personas, error: fetchError } = await supabase
        .from('personas')
        .select('id, name, creator_id')

    if (fetchError) {
        console.error('Failed to fetch personas:', fetchError)
        return
    }

    console.log(`Found ${personas?.length || 0} personas`)

    // Show current state
    personas?.forEach(p => {
        console.log(`  - ${p.name}: creator=${p.creator_id || 'null'}`)
    })

    // Update all personas to be owned by sosu
    const { data, error } = await supabase
        .from('personas')
        .update({ creator_id: SOSU_USER_ID })
        .is('creator_id', null) // Only update those without a creator
        .select('id, name')

    if (error) {
        console.error('Update error:', error)
        return
    }

    console.log(`\nUpdated ${data?.length || 0} personas to be owned by sosu:`)
    data?.forEach(p => console.log(`  ✓ ${p.name}`))

    // Also update ones with a different creator (optional - update ALL)
    const { data: allUpdated, error: allError } = await supabase
        .from('personas')
        .update({ creator_id: SOSU_USER_ID })
        .neq('creator_id', SOSU_USER_ID)
        .select('id, name')

    if (!allError && allUpdated?.length) {
        console.log(`\nAlso updated ${allUpdated.length} more personas:`)
        allUpdated.forEach(p => console.log(`  ✓ ${p.name}`))
    }

    console.log('\nDone! All personas are now owned by sosu.')
}

main()
