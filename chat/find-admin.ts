import { createAdminClient } from './lib/supabase/server'

async function findAdmin() {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('profiles').select('id').eq('is_admin', true).limit(1).single()
    if (error) {
        console.error('Error finding admin:', error)
        return
    }
    console.log('ADMIN_ID:', data.id)
}

findAdmin()
