import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function executeSql(sql: string): Promise<boolean> {
    try {
        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'))

        for (const statement of statements) {
            if (statement.length === 0) continue

            const { error } = await supabase.rpc('exec_sql', {
                sql_query: statement + ';'
            })

            if (error) {
                console.error('❌ SQL Error:', error.message)
                console.error('Statement:', statement.substring(0, 100) + '...')
                return false
            }
        }

        return true
    } catch (err: any) {
        console.error('❌ Execution error:', err.message)
        return false
    }
}

async function applyMigration(filePath: string): Promise<boolean> {
    console.log(`\n📄 Applying: ${path.basename(filePath)}`)

    const sql = fs.readFileSync(filePath, 'utf8')

    const success = await executeSql(sql)

    if (success) {
        console.log('✅ Migration applied successfully')
    } else {
        console.log('❌ Migration failed')
    }

    return success
}

async function main() {
    console.log('🚀 Applying Moments Video & Reactions Migrations\n')
    console.log('='.repeat(50))

    const migrations = [
        'supabase/migrations/20260107_moments_video_reactions.sql',
        'supabase/migrations/20260107_moments_storage_buckets.sql'
    ]

    let allSuccess = true

    for (const migration of migrations) {
        const success = await applyMigration(migration)
        if (!success) {
            allSuccess = false
            break
        }
    }

    console.log('\n' + '='.repeat(50))

    if (allSuccess) {
        console.log('\n✅ All migrations applied successfully!')
        console.log('\n📊 Summary:')
        console.log('  • Added video support to moments table')
        console.log('  • Created moment_reactions table')
        console.log('  • Set up storage buckets for videos & thumbnails')
        console.log('  • Configured RLS policies')
        console.log('  • Added indexes for performance')
        console.log('  • Created triggers for reaction counts')
        process.exit(0)
    } else {
        console.log('\n❌ Migration failed - please check errors above')
        process.exit(1)
    }
}

main()
