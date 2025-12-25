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
            <Avatar className="ring-offset-rp-base size-32 shadow-2xl ring-4 ring-white/10 ring-offset-2">
                <AvatarImage src={imageUrl || ""} alt={name} className="object-cover" />
                <AvatarFallback className="from-rp-iris to-rp-foam text-rp-base bg-gradient-to-br text-3xl font-bold">
                    {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            {/* Name and Description */}
            <div className="space-y-2">
                <h1 className="text-rp-text text-3xl font-bold tracking-tight md:text-4xl">
                    {name}
                </h1>
                {description && (
                    <p className="text-rp-subtle mx-auto max-w-md text-lg">
                        {description}
                    </p>
                )}
            </div>

            {/* Category Badge */}
            {category && (
                <Badge
                    variant="secondary"
                    className="bg-rp-overlay text-rp-text hover:bg-rp-overlay/80 rounded-full px-4 py-1 text-sm font-medium"
                >
                    {category}
                </Badge>
            )}

            {/* Stats Row */}
            <div className="text-rp-subtle flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <MessageCircle className="text-rp-iris size-5" />
                    <span className="text-rp-text font-semibold">{formatCount(totalChats)}</span>
                    <span>chats</span>
                </div>
                <div className="bg-rp-overlay h-4 w-px" />
                <div className="flex items-center gap-2">
                    <Users className="text-rp-foam size-5" />
                    <span className="text-rp-text font-semibold">{formatCount(followersCount)}</span>
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
                <p className="text-rp-muted text-sm">
                    Created by <span className="text-rp-subtle">{creatorName}</span>
                </p>
            )}
        </div>
    )
}
