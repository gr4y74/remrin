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

        const cookieStore = cookies()
        const supabase = createClient(cookieStore)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const history = await getChatHistory(supabase, user.id, personaId)

        return new Response(JSON.stringify(history), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        return handleApiError(error)
    }
}
