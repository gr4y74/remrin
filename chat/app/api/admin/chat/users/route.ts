import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function GET(request: NextRequest) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const search = searchParams.get('search') || ''
        const offset = (page - 1) * limit

        let query = supabaseAdmin
            .from('user_profiles_chat')
            .select('*', { count: 'exact' })

        if (search) {
            query = query.ilike('username', `%${search}%`)
        }

        const { data: users, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Enrich with basic stats (expensive for list, maybe skip or do simple counts if separate tables?)
        // For now return profiles. 
        // Ideally we'd join with message counts etc, but Supabase standard joins might be tricky for aggregates.
        // We'll leave stats for Detail view or specific dashboard widgets.

        return NextResponse.json({
            users,
            total: count,
            page,
            limit
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
