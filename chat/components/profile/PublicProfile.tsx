"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
    IconUser,
    IconHeart,
    IconMessageCircle,
    IconCalendar,
    IconEdit,
    IconBrandGithub,
    IconBrandTwitter,
    IconPhoto
} from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"
import { EtherealCard } from "@/components/discovery"
import { cn } from "@/lib/utils"

interface UserProfile {
    id: string
    display_name: string | null
    bio: string | null
    gender: 'male' | 'female' | null
    image_url: string | null
    created_at: string
}

interface Persona {
    id: string
    name: string
    description: string | null
    image_url: string | null
    visibility: string
    is_featured: boolean
    is_premium: boolean
    created_at: string
}

interface ProfileStats {
    personas_created: number
    total_messages: number
    followers: number
}

export function PublicProfile() {
    const params = useParams()
    const userId = params.userId as string
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [personas, setPersonas] = useState<Persona[]>([])
    const [stats, setStats] = useState<ProfileStats>({
        personas_created: 0,
        total_messages: 0,
        followers: 0
    })
    const [isOwnProfile, setIsOwnProfile] = useState(false)

    const loadProfile = useCallback(async () => {
        try {
            // Check if viewing own profile
            const { data: { user } } = await supabase.auth.getUser()
            setIsOwnProfile(user?.id === userId)

            // Load profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (profileData) {
                setProfile(profileData)
            }

            // Load public personas
            const { data: personasData } = await supabase
                .from('personas')
                .select('*')
                .eq('user_id', userId)
                .eq('visibility', 'PUBLIC')
                .order('created_at', { ascending: false })

            if (personasData) {
                setPersonas(personasData)
                setStats(prev => ({ ...prev, personas_created: personasData.length }))
            }

            // Load stats (you can expand this with actual data)
            // For now using placeholder values
            setStats(prev => ({
                ...prev,
                total_messages: 0, // TODO: Get from message count
                followers: 0 // TODO: Get from followers table
            }))

        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setLoading(false)
        }
    }, [userId, supabase])

    useEffect(() => {
        loadProfile()
    }, [loadProfile])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-rp-muted">Loading profile...</div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <IconUser className="mx-auto mb-4 size-16 text-rp-muted/50" />
                    <h2 className="text-2xl font-bold text-rp-text">Profile Not Found</h2>
                    <p className="text-rp-muted mt-2">This user doesn&apos;t exist or hasn&apos;t set up their profile yet.</p>
                </div>
            </div>
        )
    }

    const displayName = profile.display_name || 'Anonymous User'
    const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    })

    return (
        <div className="min-h-screen bg-rp-base">
            {/* Header Banner */}
            <div className="relative h-48 bg-gradient-to-r from-rp-iris via-rp-rose to-rp-love">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
            </div>

            {/* Profile Content */}
            <div className="mx-auto max-w-6xl px-4 pb-12">
                {/* Profile Header */}
                <div className="relative -mt-20 mb-8">
                    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
                        {/* Avatar */}
                        <div className="relative">
                            {profile.image_url ? (
                                <div className="relative size-32 overflow-hidden rounded-full border-4 border-rp-base shadow-xl ring-2 ring-rp-highlight-med">
                                    <Image
                                        src={profile.image_url}
                                        alt={displayName}
                                        fill
                                        sizes="128px"
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="flex size-32 items-center justify-center rounded-full border-4 border-rp-base bg-rp-iris/20 text-rp-iris shadow-xl ring-2 ring-rp-highlight-med">
                                    <IconUser size={48} />
                                </div>
                            )}
                        </div>

                        {/* Name & Bio */}
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex items-center gap-3">
                                <h1 className="font-tiempos-headline text-3xl font-bold text-rp-text">
                                    {displayName}
                                </h1>
                                {profile.gender && (
                                    <span className={cn(
                                        "rounded-full px-3 py-1 text-xs font-medium",
                                        profile.gender === 'male'
                                            ? "bg-rp-iris/10 text-rp-iris"
                                            : "bg-rp-rose/10 text-rp-rose"
                                    )}>
                                        {profile.gender === 'male' ? '♂ Male' : '♀ Female'}
                                    </span>
                                )}
                            </div>

                            {profile.bio && (
                                <p className="text-rp-muted mt-2 max-w-2xl">
                                    {profile.bio}
                                </p>
                            )}

                            <div className="mt-3 flex items-center gap-4 text-sm text-rp-subtle">
                                <div className="flex items-center gap-1">
                                    <IconCalendar size={16} />
                                    <span>Joined {joinDate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Edit Button (if own profile) */}
                        {isOwnProfile && (
                            <Link
                                href="/settings/profile"
                                className="flex items-center gap-2 rounded-lg bg-rp-iris px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rp-iris/80"
                            >
                                <IconEdit size={16} />
                                Edit Profile
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="mb-8 grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-6 text-center">
                        <div className="text-3xl font-bold text-rp-text">{stats.personas_created}</div>
                        <div className="text-rp-muted text-sm">Souls Created</div>
                    </div>
                    <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-6 text-center">
                        <div className="text-3xl font-bold text-rp-text">{stats.total_messages}</div>
                        <div className="text-rp-muted text-sm">Messages</div>
                    </div>
                    <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-6 text-center">
                        <div className="text-3xl font-bold text-rp-text">{stats.followers}</div>
                        <div className="text-rp-muted text-sm">Followers</div>
                    </div>
                </div>

                {/* Created Personas */}
                <div>
                    <h2 className="mb-6 font-tiempos-headline text-2xl font-bold text-rp-text">
                        Created Souls
                    </h2>

                    {personas.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {personas.map((persona) => (
                                <EtherealCard
                                    key={persona.id}
                                    id={persona.id}
                                    name={persona.name}
                                    description={persona.description}
                                    imageUrl={persona.image_url}
                                    rarity={persona.is_premium ? 'legendary' : 'common'}
                                    isFeatured={persona.is_featured}
                                    onClick={() => window.location.href = `/chat/${persona.id}`}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-rp-muted flex flex-col items-center justify-center rounded-xl border border-rp-highlight-med bg-rp-surface py-16 text-center">
                            <IconPhoto className="mb-4 size-16 text-rp-muted/50" />
                            <p className="text-lg font-medium">No souls created yet</p>
                            <p className="text-sm">
                                {isOwnProfile
                                    ? "Start creating your first soul!"
                                    : "This user hasn't created any public souls yet."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
