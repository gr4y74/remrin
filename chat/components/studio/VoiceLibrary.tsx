"use client"

import * as React from "react"
import { Search, Play, Pause, User, Star, MoreVertical, Flag } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export interface CommunityVoice {
    id: string
    name: string
    description?: string
    previewUrl?: string
    usageCount: number
    authorName?: string
    isPublic: boolean
}

interface VoiceLibraryProps {
    onSelectVoice?: (voiceId: string) => void
}

export function VoiceLibrary({ onSelectVoice }: VoiceLibraryProps) {
    const [voices, setVoices] = React.useState<CommunityVoice[]>([])
    const [loading, setLoading] = React.useState(true)
    const [query, setQuery] = React.useState("")
    const [playingId, setPlayingId] = React.useState<string | null>(null)

    const audioRef = React.useRef<HTMLAudioElement | null>(null)

    React.useEffect(() => {
        fetchVoices()
    }, [])

    // Stop audio when component unmounts
    React.useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    const fetchVoices = async () => {
        try {
            const res = await fetch('/api/audio/voices?provider=kokoro&type=community')
            if (!res.ok) throw new Error("Failed to load voices")
            const data = await res.json()
            setVoices(data) // Assumes API returns array of voices
        } catch (err) {
            console.error(err)
            // Mock data for initial development if API fails or is empty
            // timestamp-based ID to ensure unique keys
            setVoices([
                {
                    id: 'test-1',
                    name: 'Narrator - Deep',
                    description: 'A deep, soothing voice perfect for storytelling.',
                    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Mock
                    usageCount: 124,
                    authorName: 'Remrin',
                    isPublic: true
                },
                {
                    id: 'test-2',
                    name: 'Assistant - Friendly',
                    description: 'Cheerful and helpful assistant voice.',
                    previewUrl: '',
                    usageCount: 89,
                    authorName: 'User123',
                    isPublic: true
                }
            ])
        } finally {
            setLoading(false)
        }
    }

    const handlePlayPreview = (url: string | undefined, id: string) => {
        if (!url) {
            toast.error("No preview available")
            return
        }

        if (playingId === id) {
            audioRef.current?.pause()
            setPlayingId(null)
            return
        }

        if (audioRef.current) {
            audioRef.current.pause()
        }

        audioRef.current = new Audio(url)
        audioRef.current.onended = () => setPlayingId(null)
        audioRef.current.play().catch(e => {
            console.error(e)
            toast.error("Failed to play preview")
        })
        setPlayingId(id)
    }

    const filteredVoices = voices.filter(v =>
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        v.description?.toLowerCase().includes(query.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search voices..."
                        className="pl-9"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} className="overflow-hidden">
                            <CardHeader className="space-y-2">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-3 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVoices.map(voice => (
                        <Card key={voice.id} className="group overflow-hidden transition-all hover:border-primary/50">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            {voice.name}
                                            {voice.authorName === 'Remrin' && (
                                                <Badge variant="secondary" className="text-[10px] h-4">Official</Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 mt-1">
                                            {voice.description || "No description provided."}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Flag className="mr-2 h-4 w-4" />
                                                Report Voice
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {voice.authorName || "Anonymous"}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3" />
                                        {voice.usageCount} uses
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="gap-2 pt-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handlePlayPreview(voice.previewUrl, voice.id)}
                                >
                                    {playingId === voice.id ? (
                                        <>
                                            <Pause className="mr-2 h-3 w-3" />
                                            Stop
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-3 w-3" />
                                            Preview
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => onSelectVoice?.(voice.id)}
                                >
                                    Use Voice
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    {filteredVoices.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            No voices found matching "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
