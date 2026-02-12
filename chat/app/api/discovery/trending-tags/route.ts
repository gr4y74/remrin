import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)

        // Get trending tags based on persona metadata
        // We'll count the most common tags from personas
        const { data: personas, error } = await supabase
            .from("personas")
            .select("metadata")
            .not("metadata", "is", null)
            .limit(1000)

        if (error) {
            console.error("Error fetching personas for trending tags:", error)
            return NextResponse.json(
                { tags: getDefaultTags() },
                { status: 200 }
            )
        }

        // Extract and count tags from metadata
        const tagCounts = new Map<string, number>()

        personas?.forEach((persona) => {
            const metadata = persona.metadata as any
            if (metadata?.tags && Array.isArray(metadata.tags)) {
                metadata.tags.forEach((tag: string) => {
                    const normalizedTag = tag.trim()
                    if (normalizedTag) {
                        tagCounts.set(
                            normalizedTag,
                            (tagCounts.get(normalizedTag) || 0) + 1
                        )
                    }
                })
            }
        })

        // Sort by count and get top 6
        const sortedTags = Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)

        // Map to tag objects with colors
        const colors = [
            "bg-rp-iris",
            "bg-rp-rose",
            "bg-rp-foam",
            "bg-purple-500",
            "bg-pink-500",
            "bg-rp-gold",
        ]

        const tags = sortedTags.map(([label, count], index) => ({
            id: `tag-${index}`,
            label,
            count,
            color: colors[index % colors.length],
        }))

        // If we don't have enough tags, use defaults
        if (tags.length === 0) {
            return NextResponse.json(
                { tags: getDefaultTags() },
                { status: 200 }
            )
        }

        return NextResponse.json({ tags }, { status: 200 })
    } catch (error) {
        console.error("Error in trending-tags API:", error)
        return NextResponse.json(
            { tags: getDefaultTags() },
            { status: 200 }
        )
    }
}

function getDefaultTags() {
    return [
        { id: "1", label: "AI Companions", color: "bg-rp-iris", count: 0 },
        { id: "2", label: "Fantasy", color: "bg-rp-rose", count: 0 },
        { id: "3", label: "Roleplay", color: "bg-rp-foam", count: 0 },
        { id: "4", label: "Gaming", color: "bg-purple-500", count: 0 },
        { id: "5", label: "Anime", color: "bg-pink-500", count: 0 },
        { id: "6", label: "Creative Writing", color: "bg-rp-gold", count: 0 },
    ]
}
