import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(
    request: NextRequest,
    { params }: { params: { personaId: string } }
) {
    const { personaId } = params
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    try {
        // 1. Fetch the target persona's data
        const { data: targetPersona, error: targetError } = await supabase
            .from("personas")
            .select("category, metadata, creator_id")
            .eq("id", personaId)
            .single()

        if (targetError || !targetPersona) {
            return NextResponse.json({ error: "Persona not found" }, { status: 404 })
        }

        const targetMetadata = targetPersona.metadata as Record<string, any>
        const targetTags = Array.isArray(targetMetadata?.tags) ? targetMetadata.tags : []
        const targetCategory = targetPersona.category
        const targetOwnerId = targetPersona.creator_id

        // 2. Fetch potential candidates
        // We limit to public personas and exclude the current one
        let query = supabase
            .from("personas")
            .select(`
                id,
                name,
                description,
                image_url,
                category,
                creator_id,
                metadata
            `)
            .eq("visibility", "public")
            .neq("id", personaId)
            .limit(50)

        const { data: candidates, error: candidatesError } = await query

        if (candidatesError) {
            return NextResponse.json({ error: candidatesError.message }, { status: 500 })
        }

        // 3. Fetch stats for these candidates for popularity tie-breaking
        const candidateIds = candidates.map(c => c.id)
        const { data: statsData } = await supabase
            .from("persona_stats")
            .select("persona_id, total_chats")
            .in("persona_id", candidateIds)

        const statsMap = new Map(statsData?.map(s => [s.persona_id, s.total_chats]) || [])

        // 4. Score and sort
        const scoredCandidates = candidates.map(candidate => {
            let score = 0
            const metadata = candidate.metadata as Record<string, any>
            const tags = Array.isArray(metadata?.tags) ? metadata.tags : []

            // Shared tags weight (highest)
            const sharedTags = tags.filter((t: string) => targetTags.includes(t))
            score += sharedTags.length * 10

            // Same category weight
            if (candidate.category && candidate.category === targetCategory) {
                score += 5
            }

            // Same creator weight
            if (candidate.creator_id && candidate.creator_id === targetOwnerId) {
                score += 3
            }

            return {
                ...candidate,
                totalChats: statsMap.get(candidate.id) || 0,
                similarityScore: score
            }
        })

        // Sort by similarity score, then by popularity (totalChats)
        scoredCandidates.sort((a, b) => {
            if (b.similarityScore !== a.similarityScore) {
                return b.similarityScore - a.similarityScore
            }
            return b.totalChats - a.totalChats
        })

        // 5. Return top 10
        return NextResponse.json(scoredCandidates.slice(0, 10))

    } catch (error) {
        console.error("Error in similar souls API:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
