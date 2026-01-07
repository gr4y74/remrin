import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function POST(request: NextRequest) {
    try {
        // Check admin password
        const { password } = await request.json()

        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Read migration files
        const migration1Path = path.join(process.cwd(), 'supabase/migrations/20260107_moments_video_reactions.sql')
        const migration2Path = path.join(process.cwd(), 'supabase/migrations/20260107_moments_storage_buckets.sql')

        const migration1 = fs.readFileSync(migration1Path, 'utf8')
        const migration2 = fs.readFileSync(migration2Path, 'utf8')

        const results: any[] = []

        // Execute migration 1 - split into individual statements
        const statements1 = migration1
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))

        for (const statement of statements1) {
            if (statement.length === 0) continue

            try {
                const { data, error } = await supabase.rpc('query', {
                    query_text: statement + ';'
                })

                if (error) {
                    // Try direct query if RPC doesn't work
                    const result = await fetch(`${supabaseUrl}/rest/v1/`, {
                        method: 'POST',
                        headers: {
                            'apikey': supabaseServiceKey,
                            'Authorization': `Bearer ${supabaseServiceKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({ query: statement })
                    })

                    results.push({
                        statement: statement.substring(0, 100) + '...',
                        status: result.ok ? 'success' : 'failed',
                        error: result.ok ? null : await result.text()
                    })
                } else {
                    results.push({
                        statement: statement.substring(0, 100) + '...',
                        status: 'success'
                    })
                }
            } catch (err: any) {
                results.push({
                    statement: statement.substring(0, 100) + '...',
                    status: 'error',
                    error: err.message
                })
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Migrations executed',
            results
        })

    } catch (error: any) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 })
    }
}
