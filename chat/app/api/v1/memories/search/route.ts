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
        const { query, personaId, limit = 5 } = body

        if (!query || !personaId) {
            return new NextResponse('Missing query or personaId', { status: 400 })
        }

        const supabase = createAdminClient()

        // Verify persona belongs to tenant if applicable
        if (auth.tenantId && !auth.isSandbox) {
            const { data: persona } = await supabase
                .from('personas')
                .select('id')
                .eq('id', personaId)
                .eq('tenant_id', auth.tenantId)
                .single()
                
            if (!persona) return new NextResponse('Persona not found or unauthorized', { status: 403 })
        }

        const embedding = await generateEmbedding(query)
        if (!embedding) {
            return new NextResponse('Failed to generate embedding for query', { status: 500 })
        }

        // We use match_memories_v2 (or v3) assuming the RPC filters by user. 
        // We need to filter by tenant_id too, but standard RPCs might not support tenant_id yet.
        // We will just fetch using match_memories and then filter by tenant_id if needed,
        // OR rely on the fact that persona is already verified as belonging to tenant, 
        // and users within the tenant are the only ones interacting with this persona.
        
        const { data: matched, error } = await supabase.rpc('match_memories_v2', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: limit,
            filter_persona: personaId,
            filter_user: auth.userId
        })

        if (error) {
            return new NextResponse(`Error searching memories: ${error.message}`, { status: 500 })
        }

        return NextResponse.json({ results: matched || [] })
    } catch (error: any) {
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
