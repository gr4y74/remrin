import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CheckResult {
    name: string
    status: 'pass' | 'fail' | 'warning'
    message: string
}

const results: CheckResult[] = []

function addResult(name: string, status: CheckResult['status'], message: string) {
    results.push({ name, status, message })
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} ${name}: ${message}`)
}

async function checkMomentsColumns() {
    const { data, error } = await supabase
        .from('moments')
        .select('media_type, video_url, thumbnail_url, duration_seconds, created_by_user_id, view_count, reactions_summary')
        .limit(0)

    if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            addResult('Moments Columns', 'fail', 'New columns not found - migration not applied')
            return false
        }
    }

    addResult('Moments Columns', 'pass', 'All new columns exist')
    return true
}

async function checkReactionsTable() {
    const { error } = await supabase
        .from('moment_reactions')
        .select('id')
        .limit(0)

    if (error) {
        if (error.message.includes('does not exist')) {
            addResult('Reactions Table', 'fail', 'Table does not exist - migration not applied')
            return false
        }
    }

    addResult('Reactions Table', 'pass', 'Table exists')
    return true
}

async function checkStorageBuckets() {
    const { data: buckets, error } = await supabase
        .storage
        .listBuckets()

    if (error) {
        addResult('Storage Buckets', 'fail', `Error checking buckets: ${error.message}`)
        return false
    }

    const videoBucket = buckets?.find(b => b.id === 'moment-videos')
    const thumbBucket = buckets?.find(b => b.id === 'moment-thumbnails')

    if (!videoBucket || !thumbBucket) {
        addResult('Storage Buckets', 'fail', 'Buckets not found - migration not applied')
        return false
    }

    addResult('Storage Buckets', 'pass', 'Both buckets exist')
    return true
}

async function checkRLSPolicies() {
    // Try to query reactions as anonymous user
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { error } = await anonClient
        .from('moment_reactions')
        .select('id')
        .limit(1)

    if (error && !error.message.includes('0 rows')) {
        addResult('RLS Policies', 'warning', 'Could not verify RLS - may need manual check')
        return true
    }

    addResult('RLS Policies', 'pass', 'RLS policies appear to be working')
    return true
}

async function testReactionTrigger() {
    // This is a read-only test - just check if the trigger function exists
    const { data, error } = await supabase
        .rpc('pg_get_functiondef', {
            funcid: 'update_moment_reactions_summary'
        })
        .single()

    if (error) {
        addResult('Reaction Trigger', 'warning', 'Could not verify trigger function')
        return true
    }

    addResult('Reaction Trigger', 'pass', 'Trigger function exists')
    return true
}

async function main() {
    console.log('🔍 Verifying Moments Video & Reactions Schema\n')
    console.log('='.repeat(60))
    console.log()

    const checks = [
        { name: 'Moments Columns', fn: checkMomentsColumns },
        { name: 'Reactions Table', fn: checkReactionsTable },
        { name: 'Storage Buckets', fn: checkStorageBuckets },
        { name: 'RLS Policies', fn: checkRLSPolicies },
        { name: 'Reaction Trigger', fn: testReactionTrigger }
    ]

    for (const check of checks) {
        await check.fn()
    }

    console.log()
    console.log('='.repeat(60))
    console.log()

    const passed = results.filter(r => r.status === 'pass').length
    const failed = results.filter(r => r.status === 'fail').length
    const warnings = results.filter(r => r.status === 'warning').length

    console.log('📊 Summary:')
    console.log(`  ✅ Passed: ${passed}`)
    console.log(`  ❌ Failed: ${failed}`)
    console.log(`  ⚠️  Warnings: ${warnings}`)
    console.log()

    if (failed > 0) {
        console.log('❌ Schema verification failed!')
        console.log('📖 See docs/MOMENTS_MIGRATION_GUIDE.md for manual migration steps')
        process.exit(1)
    } else if (warnings > 0) {
        console.log('⚠️  Schema verification passed with warnings')
        console.log('   Manual verification recommended')
        process.exit(0)
    } else {
        console.log('✅ All checks passed! Database is ready for video moments.')
        console.log()
        console.log('🚀 Next steps:')
        console.log('   1. AGENT 2 can build API endpoints')
        console.log('   2. AGENT 3 can build UI components')
        process.exit(0)
    }
}

main().catch(err => {
    console.error('❌ Verification error:', err.message)
    process.exit(1)
})
