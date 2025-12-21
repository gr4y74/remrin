"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { FollowButton } from "./FollowButton"
import { MessageCircle, Users } from "lucide-react"

interface CharacterHeaderProps {
    personaId: string
    name: string
    description: string | null
    imageUrl: string | null
    category: string | null
    totalChats: number
    followersCount: number
    isFollowing: boolean
    creatorName?: string | null
    onFollowChange?: (isFollowing: boolean) => void
}

// Format large numbers: 12500 -> "12.5K"
function formatCount(count: number): string {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
}

export function CharacterHeader({
    personaId,
    name,
    description,
    imageUrl,
    category,
    totalChats,
    followersCount,
    isFollowing,
    creatorName,
    onFollowChange
}: CharacterHeaderProps) {
    return (
        <div className="flex flex-col items-center gap-6 text-center">
            {/* Large Avatar */}
            <Avatar className="size-32 ring-4 ring-white/10 ring-offset-2 ring-offset-[#0d1117] shadow-2xl">
                <AvatarImage src={imageUrl || ""} alt={name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-500 text-3xl font-bold text-white">
                    {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            {/* Name and Description */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                    {name}
                </h1>
                {description && (
                    <p className="mx-auto max-w-md text-lg text-zinc-400">
                        {description}
                    </p>
                )}
            </div>

            {/* Category Badge */}
            {category && (
                <Badge
                    variant="secondary"
                    className="rounded-full bg-white/10 px-4 py-1 text-sm font-medium text-zinc-300 hover:bg-white/15"
                >
                    {category}
                </Badge>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-6 text-zinc-400">
                <div className="flex items-center gap-2">
                    <MessageCircle className="size-5 text-purple-400" />
                    <span className="font-semibold text-white">{formatCount(totalChats)}</span>
                    <span>chats</span>
                </div>
                <div className="h-4 w-px bg-zinc-700" />
                <div className="flex items-center gap-2">
                    <Users className="size-5 text-cyan-400" />
                    <span className="font-semibold text-white">{formatCount(followersCount)}</span>
                    <span>followers</span>
                </div>
            </div>

            {/* Follow Button */}
            <FollowButton
                personaId={personaId}
                initialIsFollowing={isFollowing}
                onFollowChange={onFollowChange}
            />

            {/* Creator Attribution */}
            {creatorName && (
                <p className="text-sm text-zinc-500">
                    Created by <span className="text-zinc-400">{creatorName}</span>
                </p>
            )}
        </div>
    )
}
