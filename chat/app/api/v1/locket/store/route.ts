import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'
import { generateEmbedding } from '@/lib/chat-engine/embeddings'

export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if (!auth) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await request.json()
        const { personaId, content } = body

        if (!personaId || !content) {
            return new NextResponse('Missing personaId or content', { status: 400 })
        }

        const supabase = createAdminClient()

        // Verify persona belongs to tenant
        if (auth.tenantId && !auth.isSandbox) {
            const { data: persona } = await supabase
                .from('personas')
                .select('id')
                .eq('id', personaId)
                .eq('tenant_id', auth.tenantId)
                .single()
                
            if (!persona) return new NextResponse('Persona not found or unauthorized', { status: 403 })
        }

        const embedding = await generateEmbedding(content)

        const { data, error } = await supabase
            .from('persona_lockets')
            .insert({
                persona_id: personaId,
                content: content,
                tenant_id: auth.isSandbox ? null : auth.tenantId,
                embedding: embedding
            })
            .select()
            .single()

        if (error) {
            return new NextResponse(`Error storing locket: ${error.message}`, { status: 500 })
        }

        return NextResponse.json({ success: true, locket: data })
    } catch (error: any) {
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
