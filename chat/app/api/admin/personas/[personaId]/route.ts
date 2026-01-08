import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ personaId: string }> }
) {
    try {
        const { personaId } = await params
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Delete the persona (CASCADE will handle related data)
        const { error: deleteError } = await supabase
            .from('personas')
            .delete()
            .eq('id', personaId)

        if (deleteError) {
            console.error('Error deleting persona:', deleteError)
            return NextResponse.json(
                { error: 'Failed to delete persona', details: deleteError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unhandled error in persona DELETE:', error)
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
