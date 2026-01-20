import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CharacterProfilePage } from "@/components/profile"
import { SimilarSouls } from "@/components/character/SimilarSouls"

interface CharacterPageProps {
    params: {
        locale: string
        characterId: string
    }
}

export default async function CharacterPage({ params }: CharacterPageProps) {
    const { characterId } = params
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Fetch persona data
    const { data: persona, error: personaError } = await supabase
        .from("personas")
        .select(`
      id,
      name,
      description,
      image_url,
      video_url,
      background_url,
      category,
      metadata,
      owner_id,
      visibility,
      welcome_audio_url
    `)
        .eq("id", characterId)
        .single()

    if (personaError || !persona) {
        notFound()
    }

    // Only show public/approved personas (or owned by current user)
    const { data: { user } } = await supabase.auth.getUser()
    const isOwner = user?.id === persona.owner_id
    const isPublic = persona.visibility?.toLowerCase() === "public"

    if (!isPublic && !isOwner) {
        notFound()
    }

    // Fetch persona stats
    const { data: stats } = await supabase
        .from("persona_stats")
        .select("total_chats, followers_count")
        .eq("persona_id", characterId)
        .single()

    // Check if current user follows this persona
    let isFollowing = false
    if (user) {
        const { data: followData } = await supabase
            .from("character_follows")
            .select("persona_id")
            .eq("persona_id", characterId)
            .eq("user_id", user.id)
            .single()

        isFollowing = !!followData
    }

    // Fetch creator profile if available
    let creatorName: string | null = null
    if (persona.owner_id) {
        const { data: ownerProfile } = await supabase
            .from("profiles")
            .select("display_name, username")
            .eq("user_id", persona.owner_id)
            .single()

        if (ownerProfile) {
            creatorName = ownerProfile.display_name || ownerProfile.username || null
        }
    }

    // Parse tags from metadata
    const metadata = persona.metadata as Record<string, unknown> | null
    const tags: string[] = Array.isArray(metadata?.tags)
        ? metadata.tags as string[]
        : []

    // Parse intro message from metadata
    const introMessage = typeof metadata?.intro_message === "string"
        ? metadata.intro_message
        : null

    return (
        <>
            <CharacterProfilePage
                persona={{
                    id: persona.id,
                    name: persona.name,
                    description: persona.description,
                    imageUrl: persona.image_url,
                    videoUrl: persona.video_url,
                    backgroundUrl: persona.background_url,
                    category: persona.category,
                    tags,
                    introMessage,
                    creatorName,
                    welcomeAudioUrl: persona.welcome_audio_url
                }}
                stats={{
                    totalChats: stats?.total_chats ?? 0,
                    followersCount: stats?.followers_count ?? 0
                }}
                isFollowing={isFollowing}
                isOwner={isOwner}
            />
            <SimilarSouls personaId={characterId} />
        </>
    )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CharacterPageProps) {
    const { characterId } = params
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: persona } = await supabase
        .from("personas")
        .select("name, description, image_url, background_url")
        .eq("id", characterId)
        .single()

    if (!persona) {
        return {
            title: "Character Not Found | Remrin"
        }
    }

    return {
        title: `${persona.name} | Remrin`,
        description: persona.description || `Chat with ${persona.name} on Remrin`,
        openGraph: {
            title: persona.name,
            description: persona.description || `Chat with ${persona.name} on Remrin`,
            images: persona.image_url ? [persona.image_url] : []
        }
    }
}
