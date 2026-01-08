import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)

        const searchParams = request.nextUrl.searchParams
        const filter = searchParams.get('filter') || 'for-you' // for-you, following, trending
        const offset = parseInt(searchParams.get('offset') || '0')
        const limit = parseInt(searchParams.get('limit') || '12')

        const { data: { user } } = await supabase.auth.getUser()

        let query: any = supabase
            .from('moments')
            .select(`
        id,
        persona_id,
        created_by_user_id,
        media_type,
        image_url,
        video_url,
        thumbnail_url,
        duration_seconds,
        caption,
        created_at,
        likes_count,
        comments_count,
        shares_count,
        bookmarks_count,
        view_count,
        is_pinned,
        reactions_summary,
        personas!inner(id, name, image_url)
      `)

        // Apply filter logic
        if (filter === 'trending') {
            query = query
                .order('view_count', { ascending: false })
                .order('likes_count', { ascending: false })
        } else if (filter === 'following' && user) {
            // TODO: Implement following logic when user-persona relationships exist
            query = query.order('created_at', { ascending: false })
        } else if (filter === 'saved' && user) {
            // Join bookmarks to filter by user's saved moments
            // We use !inner to perform an INNER JOIN, ensuring we only get moments that have a matching bookmark
            query = supabase
                .from('moments')
                .select(`
                    id,
                    persona_id,
                    created_by_user_id,
                    media_type,
                    image_url,
                    video_url,
                    thumbnail_url,
                    duration_seconds,
                    caption,
                    created_at,
                    likes_count,
                    comments_count,
                    shares_count,
                    bookmarks_count,
                    view_count,
                    is_pinned,
                    reactions_summary,
                    personas!inner(id, name, image_url),
                    moment_bookmarks!inner(user_id)
                `)
                .eq('moment_bookmarks.user_id', user.id)
                .order('created_at', { ascending: false, foreignTable: 'moment_bookmarks' })
        } else {
            // For You: Mix of popular and recent
            query = query
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false })
        }

        query = query.range(offset, offset + limit - 1)

        const { data: moments, error } = await query

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch moments' }, { status: 500 })
        }

        // Get user's reactions if authenticated
        let userReactions: Record<string, string[]> = {}
        if (user && moments && moments.length > 0) {
            const { data: reactions } = await supabase
                .from('moment_reactions')
                .select('moment_id, reaction_emoji')
                .eq('user_id', user.id)
                .in('moment_id', moments.map((m: any) => m.id))

            userReactions = (reactions || []).reduce((acc: any, r: any) => {
                if (!acc[r.moment_id]) acc[r.moment_id] = []
                acc[r.moment_id].push(r.reaction_emoji)
                return acc
            }, {} as Record<string, string[]>)
        }

        const formattedMoments = (moments || []).map((m: any) => ({
            ...m,
            userReactions: userReactions[m.id] || []
        }))

        return NextResponse.json({
            moments: formattedMoments,
            hasMore: moments && moments.length === limit
        })
    } catch (error) {
        console.error('Feed error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
