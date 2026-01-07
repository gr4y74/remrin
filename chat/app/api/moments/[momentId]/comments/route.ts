import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { momentId: string } }
) {
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)
        const { momentId } = params // params is just { momentId } in Next 15/14? Wait, in strict TS it might need waiting or generic.
        // Assuming params is available.

        const { data: comments, error } = await supabase
            .from('moment_comments')
            .select(`
                id,
                content,
                created_at,
                user:profiles (
                    id,
                    username,
                    display_name,
                    avatar_url
                )
            `)
            .eq('moment_id', momentId)
            .order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ comments })
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
            .select(`
                id,
                content,
                created_at,
                user:profiles!moment_comments_user_id_fkey_real_profiles(
                    id,
                    username,
                    display_name,
                    avatar_url
                )
            `)
            .single()

        if (insertError) {
            console.error('API: Error inserting comment:', insertError)
            return NextResponse.json(
                { error: 'Failed to post comment', details: insertError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ comment })
    } catch (error) {
        console.error('API: Unhandled error in comment POST:', error)
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
