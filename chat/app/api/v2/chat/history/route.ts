import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getChatHistory } from '@/lib/chat-engine/persistence'
import { handleApiError } from '@/lib/errors'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const personaId = searchParams.get('personaId')

        if (!personaId) {
            return new Response('Persona ID is required', { status: 400 })
        }

        const workspaceId = searchParams.get('workspaceId') || undefined
        const customName = searchParams.get('customName') || undefined

        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        // Use getSession first as it's faster and often enough for same-origin dev
        const { data: { session } } = await supabase.auth.getSession()
        let user: any = session?.user

        // Fallback to get user from Authorization header
        if (!user) {
            const authHeader = request.headers.get('Authorization')
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                const { data: { user: verifiedUser } } = await supabase.auth.getUser(token)
                user = verifiedUser
            }
        }

        // If no session or token, try getUser (more secure, server-side fetch)
        if (!user) {
            const { data: { user: verifiedUser } } = await supabase.auth.getUser()
            user = verifiedUser
        }

        if (!user || !user.id) {
            console.error('❌ [API/History] Unauthorized access attempt')
            return new Response('Unauthorized', { status: 401 })
        }

        const history = await getChatHistory(supabase, user.id as string, personaId, 50, { workspaceId: workspaceId || undefined, customName: customName || undefined })

        return new Response(JSON.stringify(history), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        return handleApiError(error)
    }
}
