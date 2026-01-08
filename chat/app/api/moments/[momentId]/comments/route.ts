import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ momentId: string }> }
) {
    try {
        const { momentId } = await params
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)

        // Fetch comments with user profiles
        const { data: comments, error } = await supabase
            .from('moment_comments')
            .select(`
                id,
                content,
                created_at,
                user_id
            `)
            .eq('moment_id', momentId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('API: Error fetching comments:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Fetch user profiles for all commenters
        if (comments && comments.length > 0) {
            const userIds = [...new Set(comments.map(c => c.user_id))]
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, id, username, display_name, avatar_url')
                .in('user_id', userIds)

            // Map profiles to comments
            const commentsWithProfiles = comments.map(comment => {
                const profile = profiles?.find(p => p.user_id === comment.user_id)
                return {
                    id: comment.id,
                    content: comment.content,
                    created_at: comment.created_at,
                    user: profile ? {
                        id: profile.id,
                        username: profile.username || 'User',
                        display_name: profile.display_name,
                        avatar_url: profile.avatar_url
                    } : {
                        id: comment.user_id,
                        username: 'User',
                        display_name: null,
                        avatar_url: null
                    }
                }
            })

            return NextResponse.json({ comments: commentsWithProfiles })
        }

        return NextResponse.json({ comments: [] })
    } catch (error) {
        console.error('API: Error fetching comments:', error)
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ momentId: string }> }
) {
    try {
        const { momentId } = await params
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('API: Unauthorized comment attempt', authError)
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { content } = body

        if (!content || typeof content !== 'string' || !content.trim()) {
            return NextResponse.json(
                { error: 'Comment content is required' },
                { status: 400 }
            )
        }

        // Insert comment
        const { data: comment, error: insertError } = await supabase
            .from('moment_comments')
            .insert({
                moment_id: momentId,
                user_id: user.id,
                content: content.trim()
            })
            .select('id, content, created_at, user_id')
            .single()

        if (insertError) {
            console.error('API: Error inserting comment:', insertError)
            return NextResponse.json(
                { error: 'Failed to post comment', details: insertError.message },
                { status: 500 }
            )
        }

        // Fetch the user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('user_id', user.id)
            .single()

        const commentWithProfile = {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user: profile ? {
                id: profile.id,
                username: profile.username || user.email?.split('@')[0] || 'User',
                display_name: profile.display_name,
                avatar_url: profile.avatar_url
            } : {
                id: user.id,
                username: user.email?.split('@')[0] || 'User',
                display_name: null,
                avatar_url: null
            }
        }

        return NextResponse.json({ comment: commentWithProfile })
    } catch (error) {
        console.error('API: Unhandled error in comment POST:', error)
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}

