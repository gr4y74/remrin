"use client"

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { IconUser, IconHeart, IconWorld, IconSettings, IconMicrophone, IconPlus, IconTrash, IconLoader2, IconSparkles, IconMusic, IconUpload, IconX } from '@tabler/icons-react'
import { toast } from 'sonner'
import { BackgroundMusicPlayer } from '@/components/audio/BackgroundMusicPlayer'

interface PersonaSettingsModalProps {
    isOpen: boolean
    onClose: () => void
    personaId: string
    personaName: string
    defaultTab?: string
}

interface PersonSettings {
    name: string
    relation: string
    notes: string
}

interface PlaceSettings {
    name: string
    notes: string
}

interface Settings {
    identity: {
        call_me: string
        my_pronouns: string
        my_description: string
        my_personality: string
    }
    relationship: {
        type: string
        dynamic: string
        history: string
        boundaries: string
    }
    world: {
        setting: string
        important_people: PersonSettings[]
        important_places: PlaceSettings[]
        custom_lore: string
    }
    preferences: {
        response_style: string
        response_length: string
        emoji_usage: string
        nsfw_enabled: boolean
        custom_instructions: string
    }
    voice: {
        nickname_for_me: string
        her_catchphrases: string[]
        topics_to_avoid: string[]
        topics_she_loves: string[]
    }
}

const DEFAULT_SETTINGS: Settings = {
    identity: {
        call_me: "",
        my_pronouns: "",
        my_description: "",
        my_personality: ""
    },
    relationship: {
        type: "friend",
        dynamic: "",
        history: "",
        boundaries: ""
    },
    world: {
        setting: "",
        important_people: [],
        important_places: [],
        custom_lore: ""
    },
    preferences: {
        response_style: "adaptive",
        response_length: "adaptive",
        emoji_usage: "moderate",
        nsfw_enabled: false,
        custom_instructions: ""
    },
    voice: {
        nickname_for_me: "",
        her_catchphrases: [],
        topics_to_avoid: [],
        topics_she_loves: []
    }
}

export function PersonaSettingsModal({
    isOpen,
    onClose,
    personaId,
    personaName,
    defaultTab = "identity"
}: PersonaSettingsModalProps) {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [hasCustomizations, setHasCustomizations] = useState(false)
    const [backgroundMusicUrl, setBackgroundMusicUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [activeTab, setActiveTab] = useState(defaultTab)

    // Sync active tab with defaultTab prop when modal opens
    useEffect(() => {
        if (isOpen && defaultTab) {
            setActiveTab(defaultTab)
        }
    }, [isOpen, defaultTab])

    // Fetch existing settings
    const fetchSettings = useCallback(async () => {
        if (!personaId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/personas/settings?persona_id=${personaId}`)
            const data = await res.json()
            if (data.settings) {
                setSettings(prev => ({
                    ...DEFAULT_SETTINGS,
                    ...data.settings,
                    identity: { ...DEFAULT_SETTINGS.identity, ...data.settings?.identity },
                    relationship: { ...DEFAULT_SETTINGS.relationship, ...data.settings?.relationship },
                    world: { ...DEFAULT_SETTINGS.world, ...data.settings?.world },
                    preferences: { ...DEFAULT_SETTINGS.preferences, ...data.settings?.preferences },
                    voice: { ...DEFAULT_SETTINGS.voice, ...data.settings?.voice }
                }))
                setHasCustomizations(data.has_customizations)
                setBackgroundMusicUrl(data.background_music_url || null)
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err)
        } finally {
            setLoading(false)
        }
    }, [personaId])

    useEffect(() => {
        if (isOpen && personaId) {
            fetchSettings()
        }
    }, [isOpen, personaId, fetchSettings])

    // Save settings
    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/personas/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ persona_id: personaId, settings })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success('Personalization saved!')
            setHasCustomizations(true)
            onClose()
        } catch (err: any) {
            toast.error(err.message || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    // Reset to defaults
    const handleReset = async () => {
        if (!confirm('Reset all personalization? This cannot be undone.')) return
        setSaving(true)
        try {
            await fetch(`/api/personas/settings?persona_id=${personaId}`, { method: 'DELETE' })
            setSettings(DEFAULT_SETTINGS)
            setHasCustomizations(false)
            toast.success('Reset to defaults')
        } catch (err) {
            toast.error('Failed to reset')
        } finally {
            setSaving(false)
        }
    }

    // Update nested setting
    const updateSetting = <K extends keyof Settings>(
        category: K,
        field: keyof Settings[K],
        value: any
    ) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }))
    }

    // Add person to world
    const addPerson = () => {
        setSettings(prev => ({
            ...prev,
            world: {
                ...prev.world,
                important_people: [...prev.world.important_people, { name: '', relation: '', notes: '' }]
            }
        }))
    }

    // Remove person from world
    const removePerson = (index: number) => {
        setSettings(prev => ({
            ...prev,
            world: {
                ...prev.world,
                important_people: prev.world.important_people.filter((_, i) => i !== index)
            }
        }))
    }

    // Update person in world
    const updatePerson = (index: number, field: keyof PersonSettings, value: string) => {
        setSettings(prev => ({
            ...prev,
            world: {
                ...prev.world,
                important_people: prev.world.important_people.map((p, i) =>
                    i === index ? { ...p, [field]: value } : p
                )
            }
        }))
    }

    if (loading) {
        return (
            <Dialog open={isOpen} onOpenChange={() => onClose()}>
                <DialogContent className="sm:max-w-2xl bg-rp-surface border-rp-muted/20">
                    <div className="flex items-center justify-center py-12">
                        <IconLoader2 className="h-8 w-8 animate-spin text-rp-iris" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden bg-rp-surface border-rp-muted/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rp-text">
                        <IconSparkles className="h-5 w-5 text-rp-iris" />
                        Personalize {personaName}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-6 bg-rp-base p-0.5 h-auto">
                        <TabsTrigger value="identity" className="flex items-center gap-1.5 text-[10px] sm:text-xs py-2 px-1">
                            <IconUser className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Identity</span>
                        </TabsTrigger>
                        <TabsTrigger value="relationship" className="flex items-center gap-1.5 text-[10px] sm:text-xs py-2 px-1">
                            <IconHeart className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Relationship</span>
                        </TabsTrigger>
                        <TabsTrigger value="world" className="flex items-center gap-1.5 text-[10px] sm:text-xs py-2 px-1">
                            <IconWorld className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">World</span>
                        </TabsTrigger>
                        <TabsTrigger value="preferences" className="flex items-center gap-1.5 text-[10px] sm:text-xs py-2 px-1">
                            <IconSettings className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Prefs</span>
                        </TabsTrigger>
                        <TabsTrigger value="voice" className="flex items-center gap-1.5 text-[10px] sm:text-xs py-2 px-1">
                            <IconMicrophone className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Voice</span>
                        </TabsTrigger>
                        <TabsTrigger value="music" className="flex items-center gap-1.5 text-[10px] sm:text-xs py-2 px-1">
                            <IconMusic className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Music</span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-4 max-h-[50vh] overflow-y-auto pr-2">
                        {/* Identity Tab */}
                        <TabsContent value="identity" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label className="text-rp-text">What should I call you?</Label>
                                <Input
                                    placeholder="Your name or nickname"
                                    value={settings.identity.call_me}
                                    onChange={(e) => updateSetting('identity', 'call_me', e.target.value)}
                                    className="bg-rp-base border-rp-muted/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-rp-text">Your pronouns</Label>
                                <Select
                                    value={settings.identity.my_pronouns}
                                    onValueChange={(v) => updateSetting('identity', 'my_pronouns', v)}
                                >
                                    <SelectTrigger className="bg-rp-base border-rp-muted/30">
                                        <SelectValue placeholder="Select pronouns" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="he/him">he/him</SelectItem>
                                        <SelectItem value="she/her">she/her</SelectItem>
                                        <SelectItem value="custom">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-rp-text">About yourself</Label>
                                <Textarea
                                    placeholder="Tell me about yourself... (occupation, interests, etc.)"
                                    value={settings.identity.my_description}
                                    onChange={(e) => updateSetting('identity', 'my_description', e.target.value)}
                                    className="bg-rp-base border-rp-muted/30 min-h-[80px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-rp-text">Your personality</Label>
                                <Textarea
                                    placeholder="Your personality traits, communication style..."
                                    value={settings.identity.my_personality}
                                    onChange={(e) => updateSetting('identity', 'my_personality', e.target.value)}
                                    className="bg-rp-base border-rp-muted/30 min-h-[80px]"
                                />
                            </div>
                        </TabsContent>

                        {/* Relationship Tab */}
                        <TabsContent value="relationship" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label className="text-rp-text">Relationship type</Label>
                                <Select
                                    value={settings.relationship.type}
                                    onValueChange={(v) => updateSetting('relationship', 'type', v)}
                                >
                                    <SelectTrigger className="bg-rp-base border-rp-muted/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="friend">Friend</SelectItem>
                                        <SelectItem value="best_friend">Best Friend</SelectItem>
                                        <SelectItem value="partner">Partner</SelectItem>
                                        <SelectItem value="sibling">Sibling</SelectItem>
                                        <SelectItem value="mentor">Mentor</SelectItem>
                                        <SelectItem value="assistant">Assistant</SelectItem>
                                        <SelectItem value="companion">Companion</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-rp-text">Relationship dynamic</Label>
                                <Textarea
                                    placeholder="Describe your relationship dynamic..."
                                    value={settings.relationship.dynamic}
                                    onChange={(e) => updateSetting('relationship', 'dynamic', e.target.value)}
                                    className="bg-rp-base border-rp-muted/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-rp-text">Your history together</Label>
                                <Textarea
                                    placeholder="How did you meet? What have you been through together?"
                                    value={settings.relationship.history}
                                    onChange={(e) => updateSetting('relationship', 'history', e.target.value)}
                                    className="bg-rp-base border-rp-muted/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-rp-text">Communication boundaries</Label>
                                <Textarea
                                    placeholder="How should they communicate with you? Any preferences?"
                                    value={settings.relationship.boundaries}
                                    onChange={(e) => updateSetting('relationship', 'boundaries', e.target.value)}
                                    className="bg-rp-base border-rp-muted/30"
                                />
                            </div>
                        </TabsContent>

                        {/* World Tab */}
                        <TabsContent value="world" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label className="text-rp-text">Setting / World</Label>
                                <Textarea
                                    placeholder="Where/when does your story take place?"
                                    value={settings.world.setting}
                                    onChange={(e) => updateSetting('world', 'setting', e.target.value)}
                                    className="bg-rp-base border-rp-muted/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-rp-text">Important people</Label>
                                    <Button variant="ghost" size="sm" onClick={addPerson} className="h-7 text-rp-iris hover:text-rp-foam">
                                        <IconPlus className="h-4 w-4 mr-1" /> Add
                                    </Button>
                                </div>
                                {settings.world.important_people.map((person, i) => (
                                    <div key={i} className="flex gap-2 items-start p-2 bg-rp-base rounded-lg">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Name"
                                                    value={person.name}
                                                    onChange={(e) => updatePerson(i, 'name', e.target.value)}
                                                    className="bg-rp-overlay border-rp-muted/30 text-sm"
                                                />
                                                <Input
                                                    placeholder="Relation"
                                                    value={person.relation}
                                                    onChange={(e) => updatePerson(i, 'relation', e.target.value)}
                                                    className="bg-rp-overlay border-rp-muted/30 text-sm w-28"
                                                />
                                            </div>
                                            <Input
                                                placeholder="Notes (personality, details)"
                                                value={person.notes}
                                                onChange={(e) => updatePerson(i, 'notes', e.target.value)}
                                                className="bg-rp-overlay border-rp-muted/30 text-sm"
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rp-love hover:bg-rp-love/10" onClick={() => removePerson(i)}>
                                            <IconTrash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-rp-text">Custom lore / Background</Label>
                                <Textarea
                                    placeholder="Any additional backstory or world-building..."
                                    value={settings.world.custom_lore}
                                    onChange={(e) => updateSetting('world', 'custom_lore', e.target.value)}
                                    className="bg-rp-base border-rp-muted/30 min-h-[100px]"
                                />
                            </div>
                        </TabsContent>

                        {/* Preferences Tab */}
                        <TabsContent value="preferences" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label className="text-rp-text">Response style</Label>
                                <Select
                                    value={settings.preferences.response_style}
                                    onValueChange={(v) => updateSetting('preferences', 'response_style', v)}
                                >
                                    <SelectTrigger className="bg-rp-base border-rp-muted/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="adaptive">Adaptive (match my energy)</SelectItem>
                                        <SelectItem value="casual">Casual & Relaxed</SelectItem>
                                        <SelectItem value="formal">Formal & Professional</SelectItem>
                                        <SelectItem value="playful">Playful & Teasing</SelectItem>
                                        <SelectItem value="romantic">Romantic & Affectionate</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-rp-text">Response length</Label>
                                <Select
                                    value={settings.preferences.response_length}
                                    onValueChange={(v) => updateSetting('preferences', 'response_length', v)}
                                >
                                    <SelectTrigger className="bg-rp-base border-rp-muted/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="adaptive">Adaptive</SelectItem>
                                        <SelectItem value="short">Short & Concise</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="long">Long & Detailed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-rp-base rounded-lg">
                                <div>
                                    <Label className="text-rp-text">NSFW Content</Label>
                                    <p className="text-xs text-rp-subtle mt-0.5">Allow mature themes (must be 18+)</p>
                                </div>
                                <Switch
                                    checked={settings.preferences.nsfw_enabled}
                                    onCheckedChange={(v) => updateSetting('preferences', 'nsfw_enabled', v)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-rp-text">Special instructions</Label>
                                <Textarea
                                    placeholder="Any specific instructions for how they should behave with you..."
                                    value={settings.preferences.custom_instructions}
                                    onChange={(e) => updateSetting('preferences', 'custom_instructions', e.target.value)}
                                    className="bg-rp-base border-rp-muted/30 min-h-[100px]"
                                />
                            </div>
                        </TabsContent>

                        {/* Voice Tab */}
                        <TabsContent value="voice" className="space-y-4 mt-0">
                            <div className="space-y-2">
                                <Label className="text-rp-text">Nickname for you</Label>
                                <Input
                                    placeholder="e.g., 'darling', 'partner', 'boss'"
                                    value={settings.voice.nickname_for_me}
                                    onChange={(e) => updateSetting('voice', 'nickname_for_me', e.target.value)}
                                    className="bg-rp-base border-rp-muted/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-rp-text">Catchphrases (comma-separated)</Label>
                                <Input
                                    placeholder="e.g., Hey you~, I'm here, Let's go!"
                                    value={settings.voice.her_catchphrases?.join(', ') || ''}
                                    onChange={(e) => updateSetting('voice', 'her_catchphrases', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    className="bg-rp-base border-rp-muted/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-rp-text">Topics to avoid (comma-separated)</Label>
                                <Input
                                    placeholder="e.g., politics, religion, work stress"
                                    value={settings.voice.topics_to_avoid?.join(', ') || ''}
                                    onChange={(e) => updateSetting('voice', 'topics_to_avoid', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    className="bg-rp-base border-rp-muted/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-rp-text">Topics they love (comma-separated)</Label>
                                <Input
                                    placeholder="e.g., anime, tech, cooking, gaming"
                                    value={settings.voice.topics_she_loves?.join(', ') || ''}
                                    onChange={(e) => updateSetting('voice', 'topics_she_loves', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    className="bg-rp-base border-rp-muted/30"
                                />
                            </div>
                        </TabsContent>

                        {/* Music Tab */}
                        <TabsContent value="music" className="space-y-6 mt-0">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold text-rp-text">Background Music</h4>
                                        <p className="text-xs text-rp-subtle mt-1">Looped music that plays during your conversation.</p>
                                    </div>
                                    {backgroundMusicUrl && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => {
                                                if (confirm('Remove background music?')) {
                                                    try {
                                                        const res = await fetch(`/api/personas/${personaId}/music`, { method: 'DELETE' })
                                                        if (res.ok) {
                                                            setBackgroundMusicUrl(null)
                                                            toast.success('Music removed')
                                                        }
                                                    } catch (err) {
                                                        toast.error('Failed to remove music')
                                                    }
                                                }
                                            }}
                                            className="text-rp-love hover:bg-rp-love/10"
                                        >
                                            <IconTrash className="h-4 w-4 mr-1" /> Remove
                                        </Button>
                                    )}
                                </div>

                                {backgroundMusicUrl ? (
                                    <div className="bg-rp-base/50 rounded-xl p-6 border border-rp-muted/20 flex flex-col items-center gap-4">
                                        <BackgroundMusicPlayer
                                            musicUrl={backgroundMusicUrl}
                                            className="scale-110"
                                        />
                                        <p className="text-[10px] text-rp-muted font-mono uppercase tracking-widest">Active Track</p>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border-2 border-dashed border-rp-muted/20 bg-rp-base/30 p-10 text-center flex flex-col items-center">
                                        <IconMusic className="h-10 w-10 text-rp-muted opacity-30 mb-4" />
                                        <p className="text-sm text-rp-subtle mb-6">No background music set for this character.</p>

                                        <input
                                            type="file"
                                            accept="audio/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (!file) return

                                                setUploading(true)
                                                const toastId = toast.loading("Uploading music...")

                                                try {
                                                    const formData = new FormData()
                                                    formData.append('personaId', personaId)
                                                    formData.append('file', file)
                                                    formData.append('type', 'music')

                                                    const res = await fetch('/api/audio/upload', {
                                                        method: 'POST',
                                                        body: formData
                                                    })

                                                    const result = await res.json()
                                                    if (!res.ok) throw new Error(result.error || "Upload failed")

                                                    setBackgroundMusicUrl(result.audioUrl)
                                                    toast.success("Music uploaded successfully!", { id: toastId })
                                                } catch (err: any) {
                                                    toast.error(err.message || "Upload failed", { id: toastId })
                                                } finally {
                                                    setUploading(false)
                                                }
                                            }}
                                            className="hidden"
                                            id="music-upload"
                                            disabled={uploading}
                                        />
                                        <label htmlFor="music-upload" className="cursor-pointer inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rp-iris/20 border border-rp-iris/30 text-white hover:bg-rp-iris/30 transition-all font-bold text-xs uppercase tracking-widest">
                                            {uploading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconUpload className="h-4 w-4" />}
                                            Upload Audio Track
                                        </label>
                                    </div>
                                )}

                                <div className="bg-rp-overlay/20 rounded-lg p-4 border border-rp-muted/10">
                                    <h5 className="text-[10px] font-bold text-rp-iris uppercase tracking-widest mb-2">Music Guidelines</h5>
                                    <ul className="text-[10px] space-y-1.5 text-rp-subtle list-disc pl-4">
                                        <li>Recommended: Looping ambient tracks or instrumental music</li>
                                        <li>File size limit: 10MB (MP3, WAV, OGG)</li>
                                        <li>Background music complements the character voice and personality</li>
                                    </ul>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-rp-muted/20">
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        disabled={!hasCustomizations || saving}
                        className="text-rp-subtle hover:text-rp-love"
                    >
                        Reset to Defaults
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-rp-iris to-rp-foam text-white hover:opacity-90"
                        >
                            {saving ? <IconLoader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Personalization
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
