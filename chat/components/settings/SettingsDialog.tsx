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
import { IconUser, IconSettings, IconPalette, IconDeviceFloppy, IconVolume } from "@tabler/icons-react"
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

    useEffect(() => {
        if (open) {
            setSoundSettings(chatSounds.getSettings())
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
            const { error } = await supabase
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

            if (error) throw error

            toast.success("Profile updated successfully")
            onOpenChange(false)
        } catch (error) {
            console.error("Error updating profile:", error)
            toast.error("Failed to update profile")
        } finally {
            setIsLoading(false)
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

                            <TabsContent value="account" className="mt-0 space-y-6">
                                <h3 className="text-lg font-medium">Account Settings</h3>
                                <p className="text-sm text-rp-muted">Manage your account details and preferences.</p>
                                {/* Placeholder for account settings */}
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
