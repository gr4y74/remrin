import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Database } from "@/supabase/types"

type AgeRating = Database["public"]["Enums"]["age_rating"]

// Helper function to determine allowed age ratings based on user's age bracket
function getAllowedAgeRatings(ageBracket: string | null): AgeRating[] {
    if (!ageBracket) {
        // No age set - only show 'everyone' content
        return ['everyone']
    }

    // Parse age bracket (format: "0-12", "13-17", "18+", etc.)
    const ageMatch = ageBracket.match(/(\d+)/)
    if (!ageMatch) {
        return ['everyone']
    }

    const age = parseInt(ageMatch[1])

    if (age < 13) {
        // Kids: everyone + kids content
        return ['everyone', 'kids']
    } else if (age < 18) {
        // Teens: everyone + kids + teen content
        return ['everyone', 'kids', 'teen']
    } else {
        // Adults: all content
        return ['everyone', 'kids', 'teen', 'mature']
    }
}

// GET: Fetch all active sections with personas, filtered by user's age
export async function GET(request: Request) {
    try {
        const cookieStore = cookies()
        const supabase = createServerClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    }
                }
            }
        )

        // Get current user and their age bracket
        const { data: { user } } = await supabase.auth.getUser()
        let ageBracket: string | null = null

        if (user) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("age_bracket")
                .eq("user_id", user.id)
                .single()

            ageBracket = profile?.age_bracket || null
        }

        // Determine allowed age ratings
        const allowedRatings = getAllowedAgeRatings(ageBracket)

        // Fetch active sections filtered by age rating
        const { data: sections, error: sectionsError } = await supabase
            .from("content_sections")
            .select("*")
            .eq("is_active", true)
            .in("age_rating", allowedRatings)
            .order("sort_order", { ascending: true })

        if (sectionsError) {
            console.error("Error fetching sections:", sectionsError)
            return NextResponse.json(
                { error: sectionsError.message },
                { status: 500 }
            )
        }

        // For each section, fetch its personas
        const sectionsWithPersonas = await Promise.all(
            sections.map(async (section) => {
                const { data: sectionPersonas, error: spError } = await supabase
                    .from("section_personas")
                    .select(`
                        persona_id,
                        sort_order,
                        personas!inner(
                            id,
                            name,
                            description,
                            image_url,
                            visibility,
                            status,
                            persona_stats(
                                total_chats,
                                followers_count,
                                trending_score
                            )
                        )
                    `)
                    .eq("section_id", section.id)
                    .eq("personas.visibility", "PUBLIC")
                    .eq("personas.status", "approved")
                    .order("sort_order", { ascending: true })

                if (spError) {
                    console.error(`Error fetching personas for section ${section.id}:`, spError)
                    return {
                        ...section,
                        personas: []
                    }
                }

                // Transform the data to flatten personas
                const personas = sectionPersonas.map(sp => {
                    const persona = sp.personas as any
                    return {
                        id: persona.id,
                        name: persona.name,
                        description: persona.description,
                        image_url: persona.image_url,
                        visibility: persona.visibility,
                        status: persona.status,
                        persona_stats: Array.isArray(persona.persona_stats)
                            ? persona.persona_stats[0]
                            : persona.persona_stats
                    }
                })

                return {
                    ...section,
                    personas
                }
            })
        )

        // Filter out sections with no personas
        const nonEmptySections = sectionsWithPersonas.filter(
            section => section.personas.length > 0
        )

        return NextResponse.json({
            sections: nonEmptySections,
            age_bracket: ageBracket,
            allowed_ratings: allowedRatings
        })
    } catch (error) {
        console.error("Discovery sections error:", error)
        return NextResponse.json(
            { error: "Failed to fetch discovery sections" },
            { status: 500 }
        )
    }
}
