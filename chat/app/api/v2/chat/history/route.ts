import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getChatHistoryByName, getChatHistory } from '@/lib/chat-engine/persistence'
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

        // Single auth check - try to get user from session/cookies or header
        let user: any = null

        // 1. Try session (fastest if cached)
        const { data: { session } } = await supabase.auth.getSession()
        user = session?.user

        // 2. Fallback to getUser (more secure/reliable) or Auth header
        if (!user) {
            const authHeader = request.headers.get('Authorization')
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1]
                const { data: { user: verifiedUser } } = await supabase.auth.getUser(token)
                user = verifiedUser
            } else {
                const { data: { user: verifiedUser } } = await supabase.auth.getUser()
                user = verifiedUser
            }
        }


        if (!user || !user.id) {
            console.error('❌ [API/History] Unauthorized access attempt')
            return new Response('Unauthorized', { status: 401 })
        }

        let history
        if (customName) {
            history = await getChatHistoryByName(supabase, user.id as string, personaId, customName, 50)
        } else {
            history = await getChatHistory(supabase, user.id as string, personaId, 50, { workspaceId })
        }


        return new Response(JSON.stringify(history), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        return handleApiError(error)
    }
}
