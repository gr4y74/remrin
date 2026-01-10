"use client"

import { useState, useEffect, useRef, useCallback, useContext } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
    IconUser,
    IconCamera,
    IconCheck,
    IconX,
    IconLoader2,
    IconPhoto,
    IconTrash,
    IconUpload
} from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { RemrinContext } from "@/context/context"

interface UserProfile {
    id: string
    display_name: string | null
    image_url: string | null
    bio: string | null
    gender: 'male' | 'female' | null
    created_at: string
}

interface UploadedBackground {
    id: string
    file_path: string
    public_url: string
    created_at: string
}

export function UserProfileSettings() {
    const router = useRouter()
    const supabase = createClient()
    const { profile: globalProfile, setProfile: setGlobalProfile } = useContext(RemrinContext)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [uploadingBackground, setUploadingBackground] = useState(false)

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")
    const [gender, setGender] = useState<'male' | 'female' | null>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [backgrounds, setBackgrounds] = useState<UploadedBackground[]>([])

    const avatarInputRef = useRef<HTMLInputElement>(null)
    const backgroundInputRef = useRef<HTMLInputElement>(null)

    const loadProfile = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle()

            if (error) {
                console.error('Error loading profile:', error)
                toast.error('Failed to load profile')
                return
            }

            if (data) {
                setProfile(data)
                setDisplayName(data.display_name || '')
                setBio(data.bio || '')
                setGender(data.gender)
                setAvatarUrl(data.image_url)
            }
        } catch (error) {
            console.error('Error loading profile:', error)
            toast.error('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }, [router, supabase])

    const loadBackgrounds = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: files } = await supabase.storage
                .from('user_backgrounds')
                .list(user.id)

            if (files) {
                const backgrounds = files.map(file => {
                    const { data: { publicUrl } } = supabase.storage
                        .from('user_backgrounds')
                        .getPublicUrl(`${user.id}/${file.name}`)

                    return {
                        id: file.id,
                        file_path: `${user.id}/${file.name}`,
                        public_url: publicUrl,
                        created_at: file.created_at
                    }
                })
                setBackgrounds(backgrounds)
            }
        } catch (error) {
            console.error('Error loading backgrounds:', error)
        }
    }, [supabase])

    // Load user profile
    useEffect(() => {
        loadProfile()
        loadBackgrounds()
    }, [loadProfile, loadBackgrounds])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB')
            return
        }

        setUploadingAvatar(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const fileExt = file.name.split('.').pop()
            const fileName = `avatar-${Date.now()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setAvatarUrl(publicUrl)
            toast.success('Avatar uploaded! Click Save to apply changes.')
        } catch (error) {
            console.error('Error uploading avatar:', error)
            toast.error('Failed to upload avatar')
        } finally {
            setUploadingAvatar(false)
        }
    }

    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Background must be less than 10MB')
            return
        }

        setUploadingBackground(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const fileExt = file.name.split('.').pop()
            const fileName = `bg-${Date.now()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('user_backgrounds')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            toast.success('Background uploaded successfully!')
            loadBackgrounds()
        } catch (error) {
            console.error('Error uploading background:', error)
            toast.error('Failed to upload background')
        } finally {
            setUploadingBackground(false)
        }
    }

    const handleDeleteBackground = async (filePath: string) => {
        if (!confirm('Delete this background?')) return

        try {
            const { error } = await supabase.storage
                .from('user_backgrounds')
                .remove([filePath])

            if (error) throw error

            toast.success('Background deleted')
            loadBackgrounds()
        } catch (error) {
            console.error('Error deleting background:', error)
            toast.error('Failed to delete background')
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const profileData = {
                id: user.id,
                display_name: displayName.trim() || null,
                bio: bio.trim() || null,
                gender: gender,
                image_url: avatarUrl,
                image_path: avatarUrl || '',
                profile_context: '',
                use_azure_openai: false,
                updated_at: new Date().toISOString()
            }

            const { data, error } = await supabase
                .from('profiles')
                .upsert(profileData)
                .select()
                .single()

            if (error) {
                console.error('Supabase error:', error)
                throw error
            }

            // Also sync to user_profiles table for the public profile system
            await supabase
                .from('user_profiles')
                .upsert({
                    user_id: user.id,
                    display_name: displayName.trim() || null,
                    bio: bio.trim() || null,
                }, { onConflict: 'user_id' })

            toast.success('Profile updated successfully!')

            // Update local state AND global context
            if (data) {
                setProfile(data)
                // Sync to global context so sidebar/other components update instantly
                setGlobalProfile(data as any)
            }
        } catch (error: any) {
            console.error('Error saving profile:', error)
            toast.error(error?.message || 'Failed to save profile')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <IconLoader2 className="size-8 animate-spin text-rp-iris" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="font-tiempos-headline text-3xl font-bold text-rp-text">
                    Edit Profile
                </h1>
                <p className="text-rp-muted mt-1 text-sm">
                    Customize your profile and manage your settings
                </p>
            </div>

            {/* Avatar Section */}
            <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-6">
                <h2 className="mb-4 text-lg font-semibold text-rp-text">Profile Picture</h2>

                <div className="flex items-center gap-6">
                    {/* Avatar Preview */}
                    <div className="relative">
                        {avatarUrl ? (
                            <div className="relative size-24 overflow-hidden rounded-full ring-2 ring-rp-highlight-med">
                                <Image
                                    src={avatarUrl}
                                    alt="Avatar"
                                    fill
                                    sizes="96px"
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex size-24 items-center justify-center rounded-full bg-rp-iris/20 text-rp-iris ring-2 ring-rp-highlight-med">
                                <IconUser size={40} />
                            </div>
                        )}

                        {/* Upload Button Overlay */}
                        <button
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:opacity-100"
                        >
                            {uploadingAvatar ? (
                                <IconLoader2 className="size-6 animate-spin text-white" />
                            ) : (
                                <IconCamera className="size-6 text-white" />
                            )}
                        </button>

                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Upload Instructions */}
                    <div className="flex-1">
                        <button
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="rounded-lg bg-rp-iris px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rp-iris/80 disabled:opacity-50"
                        >
                            {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                        </button>
                        <p className="text-rp-muted mt-2 text-xs">
                            JPG, PNG or GIF. Max size 5MB.
                        </p>
                    </div>
                </div>
            </div>

            {/* User Info Section */}
            <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-6">
                <h2 className="mb-4 text-lg font-semibold text-rp-text">User Information</h2>

                <div className="space-y-4">
                    {/* Display Name */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-rp-text">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            maxLength={50}
                            placeholder="Enter your display name"
                            className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-4 py-2.5 text-rp-text placeholder:text-rp-muted focus:border-rp-iris focus:outline-none focus:ring-2 focus:ring-rp-iris/20"
                        />
                        <p className="text-rp-muted mt-1 text-xs">
                            {displayName.length}/50 characters
                        </p>
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-rp-text">
                            Gender
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setGender('male')}
                                className={cn(
                                    "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                                    gender === 'male'
                                        ? "border-rp-iris bg-rp-iris/10 text-rp-iris"
                                        : "border-rp-highlight-med bg-rp-base text-rp-muted hover:border-rp-iris/50"
                                )}
                            >
                                Male
                            </button>
                            <button
                                onClick={() => setGender('female')}
                                className={cn(
                                    "flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                                    gender === 'female'
                                        ? "border-rp-rose bg-rp-rose/10 text-rp-rose"
                                        : "border-rp-highlight-med bg-rp-base text-rp-muted hover:border-rp-rose/50"
                                )}
                            >
                                Female
                            </button>
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-rp-text">
                            Bio
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={200}
                            rows={3}
                            placeholder="Share a fun fact about yourself..."
                            className="w-full resize-none rounded-lg border border-rp-highlight-med bg-rp-base px-4 py-2.5 text-rp-text placeholder:text-rp-muted focus:border-rp-iris focus:outline-none focus:ring-2 focus:ring-rp-iris/20"
                        />
                        <p className="text-rp-muted mt-1 text-xs">
                            {bio.length}/200 characters
                        </p>
                    </div>
                </div>
            </div>

            {/* Uploaded Backgrounds Section */}
            <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-rp-text">Chat Backgrounds</h2>
                    <button
                        onClick={() => backgroundInputRef.current?.click()}
                        disabled={uploadingBackground}
                        className="flex items-center gap-2 rounded-lg bg-rp-iris px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rp-iris/80 disabled:opacity-50"
                    >
                        {uploadingBackground ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <IconUpload className="size-4" />
                        )}
                        Upload
                    </button>
                    <input
                        ref={backgroundInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundUpload}
                        className="hidden"
                    />
                </div>

                {backgrounds.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {backgrounds.map((bg) => (
                            <div
                                key={bg.id}
                                className="group relative aspect-video overflow-hidden rounded-lg border border-rp-highlight-med"
                            >
                                <Image
                                    src={bg.public_url}
                                    alt="Background"
                                    fill
                                    sizes="(max-width: 640px) 50vw, 33vw"
                                    className="object-cover"
                                />
                                <button
                                    onClick={() => handleDeleteBackground(bg.file_path)}
                                    className="absolute right-2 top-2 rounded-lg bg-red-500 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                                >
                                    <IconTrash size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-rp-muted flex flex-col items-center justify-center py-12 text-center">
                        <IconPhoto className="mb-2 size-12 text-rp-muted/50" />
                        <p className="text-sm">No backgrounds uploaded yet</p>
                        <p className="text-xs">Upload custom backgrounds for your chats</p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex-1 rounded-lg border border-rp-highlight-med bg-rp-base px-4 py-2.5 text-sm font-medium text-rp-text transition-colors hover:bg-rp-overlay"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 rounded-lg bg-rp-iris px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rp-iris/80 disabled:opacity-50"
                >
                    {saving ? (
                        <span className="flex items-center justify-center gap-2">
                            <IconLoader2 className="size-4 animate-spin" />
                            Saving...
                        </span>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>

            {/* Note */}
            <p className="text-rp-muted text-center text-xs">
                💡 Changes to your profile will be visible to other users
            </p>
        </div>
    )
}
