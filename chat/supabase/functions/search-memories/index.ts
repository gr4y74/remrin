// ═══════════════════════════════════════════════════════════════
// SEARCH-MEMORIES - RAG Endpoint for Locket Browser Extension
// ═══════════════════════════════════════════════════════════════
// Performs vector similarity search across user's persona memories
// Returns relevant context for injection into external LLMs
// ═══════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment
const SUPA_URL = Deno.env.get('SUPA_BASE_URL') ?? '';
const SUPA_KEY = Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? '';
const HF_TOKEN = Deno.env.get('HUGGINGFACE_TOKEN');

const supabase = createClient(SUPA_URL, SUPA_KEY);
const EMBEDDING_MODEL_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generate embedding using HuggingFace
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const response = await fetch(EMBEDDING_MODEL_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: text, options: { wait_for_model: true } })
        });

        if (!response.ok) {
            console.warn("Embedding API error:", response.status);
            return null;
        }

        let raw = await response.json();
        if (Array.isArray(raw) && Array.isArray(raw[0])) raw = raw[0];
        return (raw && raw.length === 384) ? raw : null;
    } catch (e) {
        console.warn("Embedding generation failed:", e);
        return null;
    }
}

/**
 * Search memories using vector similarity
 */
async function searchMemories(
    embedding: number[],
    personaId: string,
    userId: string,
    limit: number = 5,
    threshold: number = 0.35
): Promise<any[]> {
    try {
        const { data: memories, error } = await supabase.rpc('match_memories_v2', {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: limit,
            filter_persona: personaId,
            filter_user: userId
        });

        if (error) {
            console.error("Memory search error:", error);
            return [];
        }

        return memories || [];
    } catch (e) {
        console.error("Memory search failed:", e);
        return [];
    }
}

/**
 * Get persona's locket data (core memories)
 */
async function getLocketData(personaId: string): Promise<string | null> {
    const { data: lockets } = await supabase
        .from('persona_lockets')
        .select('content')
        .eq('persona_id', personaId);

    if (!lockets || lockets.length === 0) return null;

    return lockets.map(l => l.content).join('\n');
}

/**
 * Verify user has access to persona
 */
async function checkAccess(userId: string, personaId: string): Promise<boolean> {
    const { data: persona } = await supabase
        .from('personas')
        .select('visibility, owner_id')
        .eq('id', personaId)
        .single();

    if (!persona) return false;
    if (persona.visibility === 'PUBLIC') return true;
    if (persona.owner_id === userId) return true;

    // Check explicit access grants
    const { data: access } = await supabase
        .from('persona_access')
        .select('*')
        .eq('persona_id', personaId)
        .eq('user_id', userId)
        .single();

    return !!access;
}

// ─────────────────────────────────────────────────────────────
// MAIN SERVER
// ─────────────────────────────────────────────────────────────
serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { query, persona_id, user_id, limit = 5 } = payload;

        // Validate required fields
        if (!query || !user_id) {
            return new Response(JSON.stringify({
                success: false,
                error: "Missing required fields: query, user_id"
            }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        console.log(`🔍 [Search] Query: "${query.slice(0, 50)}..." | User: ${user_id}`);

        // If persona_id provided, verify access
        if (persona_id) {
            const hasAccess = await checkAccess(user_id, persona_id);
            if (!hasAccess) {
                return new Response(JSON.stringify({
                    success: false,
                    error: "Access denied to this persona"
                }), {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        // Generate embedding for query
        const embedding = await generateEmbedding(query);

        if (!embedding) {
            console.warn("[Search] Failed to generate embedding, returning empty results");
            return new Response(JSON.stringify({
                success: true,
                results: [],
                locket_data: null
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Search memories
        const memories = await searchMemories(
            embedding,
            persona_id || '',
            user_id,
            limit
        );

        // Get locket data if persona specified
        let locketData = null;
        if (persona_id) {
            locketData = await getLocketData(persona_id);
        }

        // Format results
        const results = memories.map((m: any) => ({
            content: m.content,
            similarity: m.similarity,
            role: m.role,
            created_at: m.created_at,
            tags: m.tags || []
        }));

        console.log(`✅ [Search] Found ${results.length} relevant memories`);

        return new Response(JSON.stringify({
            success: true,
            results,
            locket_data: locketData,
            query_embedding_generated: true
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("🔥 [Search] Error:", error.message);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
