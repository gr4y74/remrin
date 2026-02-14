"use client"

import { useState, useContext, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconUser, IconSettings, IconPalette, IconDeviceFloppy, IconVolume, IconMail, IconLock } from "@tabler/icons-react"
import { RemrinContext } from "@/context/context"
import { Slider } from "@/components/ui/slider"
import { chatSounds } from "@/lib/chat/soundManager"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface SettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { profile, setProfile } = useContext(RemrinContext)
    const [activeTab, setActiveTab] = useState("profile")
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        username: "",
        displayName: "",
        bio: "",
        theme: "dark"
    })
    const [soundSettings, setSoundSettings] = useState({ enabled: true, volume: 0.5 })
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [accountData, setAccountData] = useState({
        newEmail: "",
        newPassword: "",
        confirmPassword: ""
    })
    const [isUpdatingAccount, setIsUpdatingAccount] = useState(false)

    useEffect(() => {
        if (open) {
            setSoundSettings(chatSounds.getSettings())
            // Fetch current email
            const supabase = createClient()
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user?.email) setUserEmail(user.email)
            })
        }
    }, [open])

    const handleVolumeChange = (v: number[]) => {
        const val = v[0]
        setSoundSettings(prev => ({ ...prev, volume: val }))
        chatSounds.setVolume(val)
    }

    const handleSoundToggle = (enabled: boolean) => {
        setSoundSettings(prev => ({ ...prev, enabled }))
        chatSounds.setEnabled(enabled)
    }

    useEffect(() => {
        if (profile) {
            setFormData({
                username: profile.username || "",
                displayName: profile.display_name || "",
                bio: profile.bio || "",
                theme: "dark" // TODO: Connect to actual theme state
            })

            // Sync sound settings from profile if available
            if (profile.customization_json?.sound_settings) {
                const { enabled, volume } = profile.customization_json.sound_settings
                setSoundSettings({ enabled, volume })
                chatSounds.setEnabled(enabled)
                chatSounds.setVolume(volume)
            }
        }
    }, [profile])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const supabase = createClient()

            // 1. Update Profile (profiles table)
            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    username: formData.username,
                    display_name: formData.displayName,
                    bio: formData.bio,
                    customization_json: {
                        ...profile?.customization_json,
                        sound_settings: {
                            enabled: soundSettings.enabled,
                            volume: soundSettings.volume
                        }
                    }
                })
                .eq("id", profile?.id)

            if (profileError) throw profileError

            // 2. Also Update User Profile (user_profiles table)
            const { error: userProfileError } = await supabase
                .from("user_profiles")
                .update({
                    username: formData.username,
                    display_name: formData.displayName,
                    bio: formData.bio
                })
                .eq("user_id", profile?.user_id)

            if (userProfileError) {
                console.warn("Minor: Failed to update user_profiles table, but profiles table was updated:", userProfileError)
            }

            toast.success("Profile updated successfully")
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating profile:", error)
            toast.error("Failed to update profile")
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateEmail = async () => {
        if (!accountData.newEmail) return toast.info("Please enter a new email address.")
        if (accountData.newEmail === userEmail) return toast.info("New email is the same as the current one.")

        setIsUpdatingAccount(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({ email: accountData.newEmail })
            if (error) throw error
            toast.success("Verification email sent to " + accountData.newEmail)
            setAccountData(prev => ({ ...prev, newEmail: "" }))
        } catch (error: any) {
            toast.error(error.message || "Failed to update email")
        } finally {
            setIsUpdatingAccount(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (!accountData.newPassword) return toast.info("Please enter a new password.")
        if (accountData.newPassword !== accountData.confirmPassword) return toast.error("Passwords do not match.")
        if (accountData.newPassword.length < 6) return toast.info("Password must be at least 6 characters.")

        setIsUpdatingAccount(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({ password: accountData.newPassword })
            if (error) throw error
            toast.success("Password updated successfully")
            setAccountData(prev => ({ ...prev, newPassword: "", confirmPassword: "" }))
        } catch (error: any) {
            toast.error(error.message || "Failed to update password")
        } finally {
            setIsUpdatingAccount(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[100dvh] w-full max-w-none flex-col gap-0 border-0 p-0 sm:h-auto sm:max-w-2xl sm:rounded-xl sm:border sm:p-6 md:h-[600px] md:flex-row md:overflow-hidden">
                {/* Header (Mobile Only) */}
                <div className="flex items-center justify-between border-b border-rp-highlight-med bg-rp-surface px-4 py-3 sm:hidden">
                    <DialogTitle>Settings</DialogTitle>
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
                </div>

                {/* Sidebar / Tabs List */}
                <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex flex-1 flex-col overflow-hidden md:flex-row">
                    <div className="w-full border-b border-rp-highlight-med bg-rp-base/50 p-2 md:w-48 md:border-b-0 md:border-r md:p-4">
                        <div className="hidden pb-4 pl-2 font-semibold md:block">Settings</div>
                        <TabsList className="mb-0 flex w-full justify-start gap-2 overflow-x-auto bg-transparent p-0 md:flex-col md:items-stretch">
                            <TabsTrigger
                                value="profile"
                                className="flex justify-start gap-2 data-[state=active]:bg-rp-highlight-low md:w-full"
                            >
                                <IconUser size={16} />
                                Profile
                            </TabsTrigger>
                            <TabsTrigger
                                value="account"
                                className="flex justify-start gap-2 data-[state=active]:bg-rp-highlight-low md:w-full"
                            >
                                <IconSettings size={16} />
                                Account
                            </TabsTrigger>
                            <TabsTrigger
                                value="appearance"
                                className="flex justify-start gap-2 data-[state=active]:bg-rp-highlight-low md:w-full"
                            >
                                <IconPalette size={16} />
                                Appearance
                            </TabsTrigger>
                            <TabsTrigger
                                value="sounds"
                                className="flex justify-start gap-2 data-[state=active]:bg-rp-highlight-low md:w-full"
                            >
                                <IconVolume size={16} />
                                Sounds
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Content Area */}
                    <div className="flex flex-1 flex-col overflow-hidden bg-rp-surface">
                        <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
                            <TabsContent value="profile" className="mt-0 space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Profile Information</h3>

                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src={profile?.avatar_url || ""} />
                                            <AvatarFallback>User</AvatarFallback>
                                        </Avatar>
                                        <Button variant="outline" size="sm">Change Avatar</Button>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input
                                            id="username"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            className="h-12 md:h-10" // Mobile optimized height
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="displayName">Display Name</Label>
                                        <Input
                                            id="displayName"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            className="h-12 md:h-10"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="bio">Bio</Label>
                                        <Textarea
                                            id="bio"
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="min-h-[100px]"
                                        />
                                        <p className="text-xs text-rp-muted">Brief description for your profile.</p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="account" className="mt-0 space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-rp-text">
                                            <IconMail size={20} className="text-rp-iris" />
                                            <h3 className="text-lg font-medium">Email Address</h3>
                                        </div>
                                        <div className="rounded-lg border border-rp-highlight-low bg-rp-base/30 p-4 space-y-4">
                                            <div className="grid gap-1.5">
                                                <Label className="text-rp-subtle">Current Email</Label>
                                                <div className="px-3 py-2 text-rp-text bg-rp-overlay/50 rounded-md border border-rp-highlight-med opacity-70">
                                                    {userEmail || "Loading..."}
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="newEmail">New Email</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="newEmail"
                                                        value={accountData.newEmail}
                                                        onChange={(e) => setAccountData({ ...accountData, newEmail: e.target.value })}
                                                        placeholder="Enter new email..."
                                                        className="h-10"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleUpdateEmail}
                                                        disabled={isUpdatingAccount || !accountData.newEmail}
                                                    >
                                                        Update
                                                    </Button>
                                                </div>
                                                <p className="text-[10px] text-rp-muted">Requires verification link sent to new email.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-rp-highlight-low">
                                        <div className="flex items-center gap-2 text-rp-text">
                                            <IconLock size={20} className="text-rp-love" />
                                            <h3 className="text-lg font-medium">Change Password</h3>
                                        </div>
                                        <div className="rounded-lg border border-rp-highlight-low bg-rp-base/30 p-4 space-y-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="newPassword">New Password</Label>
                                                <Input
                                                    id="newPassword"
                                                    type="password"
                                                    value={accountData.newPassword}
                                                    onChange={(e) => setAccountData({ ...accountData, newPassword: e.target.value })}
                                                    placeholder="Enter new password..."
                                                    className="h-10"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    value={accountData.confirmPassword}
                                                    onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                                                    placeholder="Confirm new password..."
                                                    className="h-10"
                                                />
                                            </div>
                                            <Button
                                                className="w-full bg-rp-love hover:bg-rp-love/80 text-white"
                                                onClick={handleUpdatePassword}
                                                disabled={isUpdatingAccount || !accountData.newPassword}
                                            >
                                                {isUpdatingAccount ? "Updating..." : "Update Password"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="appearance" className="mt-0 space-y-6">
                                <h3 className="text-lg font-medium">Appearance</h3>
                                <div className="flex items-center justify-between rounded-lg border border-rp-highlight-low p-4">
                                    <div className="space-y-0.5">
                                        <Label>Dark Mode</Label>
                                        <p className="text-xs text-rp-muted">Enable dark mode for the application</p>
                                    </div>
                                    <Switch checked={true} />
                                </div>
                            </TabsContent>

                            <TabsContent value="sounds" className="mt-0 space-y-6">
                                <h3 className="text-lg font-medium">Sound Settings</h3>

                                <div className="flex items-center justify-between rounded-lg border border-rp-highlight-low p-4">
                                    <div className="space-y-0.5">
                                        <Label>Enable Sounds</Label>
                                        <p className="text-xs text-rp-muted">Play sound effects for chat events</p>
                                    </div>
                                    <Switch
                                        checked={soundSettings.enabled}
                                        onCheckedChange={handleSoundToggle}
                                    />
                                </div>

                                <div className="space-y-4 rounded-lg border border-rp-highlight-low p-4">
                                    <div className="space-y-0.5">
                                        <Label>Volume</Label>
                                        <p className="text-xs text-rp-muted">Adjust sound effect volume</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <IconVolume size={20} className="text-rp-muted" />
                                        <Slider
                                            value={[soundSettings.volume]}
                                            max={1}
                                            step={0.1}
                                            onValueChange={handleVolumeChange}
                                            className="flex-1"
                                        />
                                        <span className="w-8 text-right text-sm">{Math.round(soundSettings.volume * 100)}%</span>
                                    </div>
                                </div>

                                <Button variant="outline" onClick={() => chatSounds.play('imReceive')}>
                                    <IconVolume className="mr-2 h-4 w-4" />
                                    Test Sound
                                </Button>
                            </TabsContent>
                        </div>

                        {/* Sticky Footer for Mobile (and Desktop) */}
                        <div className="sticky bottom-0 border-t border-rp-highlight-med bg-rp-surface p-4 md:static md:bg-transparent">
                            <Button
                                className="w-full md:w-auto"
                                onClick={handleSave}
                                disabled={isLoading}
                            >
                                <IconDeviceFloppy className="mr-2 h-4 w-4" />
                                {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
