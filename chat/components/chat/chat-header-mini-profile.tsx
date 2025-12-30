"use client"

import { RemrinContext } from "@/context/context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    IconChevronUp,
    IconChevronDown,
    IconSettings,
    IconMessage,
    IconUsers,
    IconMail
} from "@tabler/icons-react"
import { FC, useContext, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { FollowButton } from "@/components/profile"

interface ChatHeaderMiniProfileProps {
    onToggle?: (isExpanded: boolean) => void
}

export const ChatHeaderMiniProfile: FC<ChatHeaderMiniProfileProps> = ({
    onToggle
}) => {
    const { selectedPersona } = useContext(RemrinContext)
    const [isExpanded, setIsExpanded] = useState(false)

    if (!selectedPersona) return null

    const handleToggle = () => {
        const newState = !isExpanded
        setIsExpanded(newState)
        onToggle?.(newState)
    }

    const totalChats = ((selectedPersona as any).total_chats || 0).toLocaleString()
    const followers = ((selectedPersona as any).followers_count || 0).toLocaleString()
    const creatorUsername = (selectedPersona as any).creator_username || "remrin"

    return (
        <div className="border-b border-rp-highlight-low bg-rp-surface/95 backdrop-blur-sm rounded-b-lg">
            {/* Collapsed State - Always Visible */}
            <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-4">
                    {/* Character Avatar */}
                    <button
                        onClick={handleToggle}
                        className="relative group"
                    >
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-rp-iris/50 shadow-lg shadow-rp-iris/30 transition-all group-hover:border-rp-iris group-hover:shadow-rp-iris/50">
                            {selectedPersona.image_url && (
                                <Image
                                    src={selectedPersona.image_url}
                                    alt={selectedPersona.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-rp-surface shadow-lg"></div>
                    </button>

                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-rp-text font-semibold text-lg">{selectedPersona.name}</h2>
                            <p className="text-rp-subtle text-sm">Created by @{creatorUsername}</p>
                        </div>

                        {!isExpanded && (
                            <div className="flex items-center gap-1 text-xs text-green-400 ml-2">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Active Now</span>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    className="relative z-40 flex items-center gap-2 px-4 py-2 bg-rp-overlay/50 hover:bg-rp-highlight-med text-rp-subtle hover:text-rp-text rounded-lg transition-all border border-rp-highlight-low hover:border-rp-highlight-med"
                >
                    <span className="text-sm font-medium">
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                    </span>
                    {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                </button>
            </div>

            {/* Expanded State */}
            {isExpanded && (
                <div className="border-t border-rp-highlight-low rounded-b-lg animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-6 px-6 py-5 w-full">
                        {/* Large Character Portrait */}
                        <div className="relative flex-shrink-0">
                            <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-rp-iris/30 shadow-2xl shadow-rp-iris/20">
                                {selectedPersona.image_url && (
                                    <Image
                                        src={selectedPersona.image_url}
                                        alt={selectedPersona.name}
                                        width={128}
                                        height={128}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-rp-base px-3 py-1 rounded-full border border-rp-highlight-low shadow-lg">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-green-400 text-xs font-medium">Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Character Info - Takes remaining space */}
                        <div className="flex-1 min-w-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-rp-text mb-1">{selectedPersona.name}</h3>
                                        <p className="text-rp-subtle text-sm mb-3">Created by @{creatorUsername}</p>

                                        {/* Stats */}
                                        <div className="flex items-center gap-6 mt-3 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <IconMessage size={16} className="text-rp-subtle" />
                                                <span className="text-rp-text font-semibold">{totalChats}</span>
                                                <span className="text-rp-subtle text-sm">Chats</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <IconUsers size={16} className="text-rp-subtle" />
                                                <span className="text-rp-text font-semibold">{followers}</span>
                                                <span className="text-rp-subtle text-sm">Followers</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <IconMail size={16} className="text-rp-subtle" />
                                                <span className="text-rp-text font-semibold">∞</span>
                                                <span className="text-rp-subtle text-sm">Messages</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Character Traits */}
                                <div className="space-y-2.5">
                                    <div className="flex items-start gap-3 p-2.5 bg-rp-base/50 rounded-lg border border-rp-highlight-low/30">
                                        <span className="text-xl">💬</span>
                                        <div>
                                            <p className="text-rp-text text-sm font-medium">Available for chat</p>
                                            <p className="text-rp-subtle text-xs">Ready to assist you</p>
                                        </div>
                                    </div>

                                    {selectedPersona.description && (
                                        <div className="flex items-start gap-3 p-2.5 bg-rp-base/50 rounded-lg border border-rp-highlight-low/30">
                                            <span className="text-xl">🌸</span>
                                            <div>
                                                <p className="text-rp-text text-sm font-medium line-clamp-1">
                                                    {selectedPersona.description.split('.')[0]}
                                                </p>
                                                <p className="text-rp-subtle text-xs">Always at your service</p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedPersona.category && (
                                        <div className="flex items-start gap-3 p-2.5 bg-rp-base/50 rounded-lg border border-rp-highlight-low/30">
                                            <span className="text-xl">💙</span>
                                            <div>
                                                <p className="text-rp-text text-sm font-medium">{selectedPersona.category}</p>
                                                <p className="text-rp-subtle text-xs">Character type</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 flex-shrink-0">
                            <Link href={`/character/${selectedPersona.id}`}>
                                <button className="px-6 py-3 bg-gradient-to-r from-rp-iris to-pink-500 hover:from-rp-iris/80 hover:to-pink-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-rp-iris/30 hover:shadow-rp-iris/50 whitespace-nowrap w-full">
                                    View Profile
                                </button>
                            </Link>
                            <FollowButton personaId={selectedPersona.id} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
