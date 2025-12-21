"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CharacterHeader } from "./CharacterHeader"
import { SoulCardDisplay } from "./SoulCardDisplay"
import { MessageCircle, ArrowLeft } from "lucide-react"

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
}

interface CharacterProfilePageProps {
    persona: PersonaData
    stats: PersonaStats
    isFollowing: boolean
}

export function CharacterProfilePage({
    persona,
    stats,
    isFollowing
}: CharacterProfilePageProps) {
    return (
        <div className="relative min-h-screen bg-[#0d1117]">
            {/* Blurred Hero Background */}
            {persona.imageUrl && (
                <div className="absolute inset-0 overflow-hidden">
                    <Image
                        src={persona.imageUrl}
                        alt=""
                        fill
                        className="object-cover opacity-30 blur-3xl scale-110"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117]/50 via-[#0d1117]/80 to-[#0d1117]" />
                </div>
            )}

            {/* Content */}
            <div className="relative z-10">
                {/* Back Button */}
                <div className="px-4 py-4 md:px-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"
                    >
                        <ArrowLeft className="size-5" />
                        <span>Back</span>
                    </Link>
                </div>

                {/* Main Content */}
                <main className="mx-auto max-w-4xl px-4 pb-24 pt-8 md:px-8">
                    <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
                        {/* Left Column - Soul Card */}
                        <div className="mx-auto w-full max-w-xs shrink-0 lg:mx-0">
                            <SoulCardDisplay
                                name={persona.name}
                                imageUrl={persona.imageUrl}
                                tags={persona.tags}
                            />
                        </div>

                        {/* Right Column - Character Details */}
                        <div className="flex-1 space-y-8">
                            {/* Header */}
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

                            {/* Intro Message Preview */}
                            {persona.introMessage && (
                                <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-xl">
                                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                                        First Message
                                    </h2>
                                    <p className="text-base italic leading-relaxed text-zinc-300">
                                        &ldquo;{persona.introMessage}&rdquo;
                                    </p>
                                </div>
                            )}

                            {/* Start Chat CTA */}
                            <div className="pt-4">
                                <Link href={`/chat/${persona.id}`} className="block">
                                    <Button
                                        size="lg"
                                        className="group w-full rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 py-6 text-lg font-bold text-white shadow-2xl shadow-purple-500/25 transition-all duration-300 hover:from-purple-500 hover:to-cyan-400 hover:shadow-purple-500/40"
                                    >
                                        <MessageCircle className="mr-3 size-6 transition-transform duration-300 group-hover:scale-110" />
                                        Start Chat
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
