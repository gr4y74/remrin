
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        // 1. Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const personaId = params.id
        if (!personaId) {
            return new Response('Persona ID is required', { status: 400 })
        }

        // 2. Fetch Persona Data
        // We select fields relevant for an AI agent context
        const { data: persona, error } = await supabase
            .from('personas')
            .select(`
                id,
                name,
                description,
                system_prompt,
                intro_message,
                image_url,
                hero_image_url,
                tags,
                category,
                voice_id,
                metadata
            `)
            .eq('id', personaId)
            .single()

        if (error || !persona) {
            return new Response('Persona not found', { status: 404 })
        }

        // 3. Construct "Soul" JSON
        // This format is designed to be generic enough for OpenClaw/Moltbot or other agents
        const soulExport = {
            format: "remrin-soul-v1",
            compatibility: ["openclaw", "moltbot", "sillytavern"],
            exported_at: new Date().toISOString(),
            character: {
                name: persona.name,
                description: persona.description,
                system_prompt: persona.system_prompt,
                first_message: persona.intro_message,
                avatar: persona.image_url,
                banner: persona.hero_image_url,
                voice_id: persona.voice_id,
                tags: persona.tags || [],
                metadata: {
                    ...persona.metadata,
                    remrin_id: persona.id,
                    category: persona.category
                }
            }
        }

        // 4. Return as JSON download
        return new Response(JSON.stringify(soulExport, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${persona.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_soul.json"`
            }
        })

    } catch (error) {
        console.error('Error exporting persona:', error)
        return new Response('Internal Server Error', { status: 500 })
    }
}
