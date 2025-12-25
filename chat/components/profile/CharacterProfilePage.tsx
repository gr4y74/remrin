"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CharacterHeader } from "./CharacterHeader"
import { SoulCardDisplay } from "./SoulCardDisplay"
import { MomentsGallery, MomentData } from "@/components/moments"
import { MessageCircle, ArrowLeft, Loader2, ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useParallaxScroll } from "@/lib/animations"
import { cn } from "@/lib/utils"

interface PersonaStats {
    totalChats: number
    followersCount: number
}

interface PersonaData {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    category: string | null
    tags: string[]
    introMessage: string | null
    creatorName?: string | null
    ownerId?: string | null
    systemPrompt?: string | null
}

interface CharacterProfilePageProps {
    persona: PersonaData
    stats: PersonaStats
    isFollowing: boolean
    moments?: MomentData[]
    hasMoments?: boolean
}

export function CharacterProfilePage({
    persona,
    stats,
    isFollowing,
    moments = [],
    hasMoments = false
}: CharacterProfilePageProps) {
    const router = useRouter()
    const [isStartingChat, setIsStartingChat] = useState(false)
    const parallaxOffset = useParallaxScroll(0.3)

    const handleStartChat = async () => {
        setIsStartingChat(true)
        try {
            const supabase = createClient()

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                // Redirect to login if not authenticated
                router.push("/login")
                return
            }

            // Get user's default workspace (first one they're a member of)
            const { data: workspaces } = await supabase
                .from("workspaces")
                .select("id")
                .eq("user_id", user.id)
                .limit(1)
                .single()

            if (!workspaces) {
                console.error("No workspace found")
                setIsStartingChat(false)
                return
            }

            // Create a chat with this persona
            const { data: chat, error } = await supabase
                .from("chats")
                .insert({
                    user_id: user.id,
                    workspace_id: workspaces.id,
                    name: `Chat with ${persona.name}`,
                    model: "deepseek-chat",
                    prompt: persona.systemPrompt || persona.description || `You are ${persona.name}. Be helpful and stay in character.`,
                    temperature: 0.7,
                    context_length: 4096,
                    include_profile_context: true,
                    include_workspace_instructions: false,
                    embeddings_provider: "openai"
                })
                .select()
                .single()

            if (error) throw error

            // Navigate to the chat
            router.push(`/${workspaces.id}/chat/${chat.id}`)
        } catch (error) {
            console.error("Error starting chat:", error)
            setIsStartingChat(false)
        }
    }

    return (
        <div className="relative min-h-screen bg-rp-base">
            {/* Blurred Hero Background with Parallax */}
            {persona.imageUrl && (
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                        transform: `translateY(${parallaxOffset}px)`,
                        willChange: 'transform'
                    }}
                >
                    <Image
                        src={persona.imageUrl}
                        alt=""
                        fill
                        className="object-cover opacity-30 blur-3xl scale-110"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-rp-base/50 via-rp-base/80 to-rp-base" />
                </div>
            )}

            {/* Content */}
            <div className="relative z-10">
                {/* Back Button */}
                <div className="px-4 py-4 md:px-8 animate-fade-in">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-rp-subtle transition-all duration-300 hover:text-rp-text hover:translate-x-[-4px]"
                    >
                        <ArrowLeft className="size-5" />
                        <span>Back</span>
                    </button>
                </div>

                {/* Main Content */}
                <main className="mx-auto max-w-4xl px-4 pb-24 pt-8 md:px-8">
                    <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
                        {/* Left Column - Soul Card */}
                        <div
                            className="mx-auto w-full max-w-xs shrink-0 lg:mx-0 animate-fade-in-up"
                            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
                        >
                            <SoulCardDisplay
                                name={persona.name}
                                imageUrl={persona.imageUrl}
                                tags={persona.tags}
                            />
                        </div>

                        {/* Right Column - Character Details */}
                        <div className="flex-1 space-y-8">
                            {/* Header */}
                            <div
                                className="animate-fade-in-up"
                                style={{ animationDelay: '200ms', animationFillMode: 'both' }}
                            >
                                <CharacterHeader
                                    personaId={persona.id}
                                    name={persona.name}
                                    description={persona.description}
                                    imageUrl={persona.imageUrl}
                                    category={persona.category}
                                    totalChats={stats.totalChats}
                                    followersCount={stats.followersCount}
                                    isFollowing={isFollowing}
                                    creatorName={persona.creatorName}
                                />
                            </div>

                            {/* Intro Message Preview */}
                            {persona.introMessage && (
                                <div
                                    className="rounded-2xl bg-rp-surface p-6 backdrop-blur-xl animate-fade-in-up transition-all duration-300 hover:bg-rp-overlay"
                                    style={{ animationDelay: '300ms', animationFillMode: 'both' }}
                                >
                                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-rp-muted">
                                        First Message
                                    </h2>
                                    <p className="text-base italic leading-relaxed text-rp-text">
                                        &ldquo;{persona.introMessage}&rdquo;
                                    </p>
                                </div>
                            )}

                            {/* Start Chat CTA with floating animation */}
                            <div
                                className="pt-4 animate-fade-in-up"
                                style={{ animationDelay: '400ms', animationFillMode: 'both' }}
                            >
                                <Button
                                    size="lg"
                                    onClick={handleStartChat}
                                    disabled={isStartingChat}
                                    className={cn(
                                        "group w-full rounded-2xl bg-gradient-to-r from-rp-iris to-rp-foam py-6 text-lg font-bold text-rp-base",
                                        "shadow-2xl shadow-rp-iris/25 transition-all duration-300",
                                        "hover:from-rp-iris/80 hover:to-rp-foam/80 hover:shadow-rp-iris/40 hover:scale-[1.02]",
                                        "disabled:opacity-70",
                                        !isStartingChat && "animate-float"
                                    )}
                                >
                                    {isStartingChat ? (
                                        <>
                                            <Loader2 className="mr-3 size-6 animate-spin" />
                                            Starting Chat...
                                        </>
                                    ) : (
                                        <>
                                            <MessageCircle className="mr-3 size-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                                            Start Chat
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Moments Section */}
                            {(hasMoments || moments.length > 0) && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="flex items-center gap-2 text-lg font-semibold text-rp-text">
                                            <ImageIcon className="size-5 text-rp-iris" />
                                            Moments
                                        </h2>
                                        {moments.length > 0 && (
                                            <Link
                                                href={`/moments?persona=${persona.id}`}
                                                className="text-sm text-rp-iris transition-colors hover:text-rp-rose"
                                            >
                                                View All →
                                            </Link>
                                        )}
                                    </div>
                                    {moments.length > 0 ? (
                                        <MomentsGallery
                                            initialMoments={moments}
                                            personaId={persona.id}
                                            initialHasMore={false}
                                            showViewAllLink={true}
                                            viewAllHref={`/moments?persona=${persona.id}`}
                                        />
                                    ) : (
                                        <div className="rounded-2xl bg-rp-surface p-8 text-center backdrop-blur-xl">
                                            <ImageIcon className="mx-auto mb-3 size-12 text-rp-muted" />
                                            <p className="text-rp-subtle">No moments yet</p>
                                            <p className="mt-1 text-sm text-rp-muted">
                                                Check back later for gallery content
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
