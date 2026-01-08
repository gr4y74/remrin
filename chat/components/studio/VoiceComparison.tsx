"use client"

import * as React from "react"
import { Play, Pause, ThumbsUp, Plus, Trash2, Wand2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAudioGeneration } from "@/hooks/useAudioGeneration"

interface VoiceOption {
    id: string
    name: string
    provider?: string
}

interface VoiceComparisonProps {
    availableVoices: VoiceOption[]
    onSave?: (result: { winnerId: string, text: string, comparisonIds: string[] }) => void
}

interface ComparisonSlotProps {
    voice: VoiceOption | undefined
    text: string
    isGenerating: boolean
    onGenerate: () => void
    onVote: () => void
    isWinner: boolean
    onRemove: () => void
    canRemove: boolean
    availableVoices: VoiceOption[]
    onVoiceChange: (voiceId: string) => void
}

const ComparisonSlot = ({
    voice,
    text,
    isWinner,
    onVote,
    onRemove,
    canRemove,
    availableVoices,
    onVoiceChange
}: ComparisonSlotProps) => {
    const { generate, audioUrl, loading, progress } = useAudioGeneration()
    const [isPlaying, setIsPlaying] = React.useState(false)
    const audioRef = React.useRef<HTMLAudioElement | null>(null)



    const handlePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleGenerate = async () => {
        if (!voice) return
        await generate(text, { voiceId: voice.id })
    }

    return (
        <Card className={cn(
            "relative transition-all duration-300",
            isWinner ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
        )}>
            <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <Select value={voice?.id} onValueChange={onVoiceChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Voice" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableVoices.map(v => (
                                <SelectItem key={v.id} value={v.id}>
                                    {v.name} {v.provider ? `(${v.provider})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {canRemove && (
                        <Button variant="ghost" size="icon" onClick={onRemove} className="shrink-0 h-8 w-8 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant={isPlaying ? "default" : "outline"}
                        size="icon"
                        onClick={handlePlay}
                        disabled={!audioUrl || loading}
                        className="h-12 w-12 rounded-full shrink-0"
                    >
                        {loading ? (
                            <div className="text-[10px] font-bold">{progress}%</div>
                        ) : isPlaying ? (
                            <Pause className="h-5 w-5" />
                        ) : (
                            <Play className="h-5 w-5 ml-1" />
                        )}
                    </Button>

                    <div className="flex-1 space-y-2">
                        {audioUrl ? (
                            <div className="h-8 w-full bg-muted/20 rounded flex items-center px-2">
                                <div className="h-1 bg-primary/20 w-full rounded-full overflow-hidden">
                                    <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
                                </div>
                                <audio
                                    ref={audioRef}
                                    src={audioUrl}
                                    onEnded={() => setIsPlaying(false)}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full h-8"
                                onClick={handleGenerate}
                                disabled={!voice || loading || !text}
                            >
                                <Wand2 className="mr-2 h-3 w-3" />
                                Generate
                            </Button>
                        )}
                    </div>
                </div>

                <Button
                    variant={isWinner ? "default" : "ghost"}
                    className={cn(
                        "w-full",
                        isWinner && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={onVote}
                    disabled={!audioUrl}
                >
                    <ThumbsUp className={cn("mr-2 h-4 w-4", isWinner && "fill-current")} />
                    {isWinner ? "Selected Favorite" : "Vote as Favorite"}
                </Button>
            </CardContent>
        </Card>
    )
}

export function VoiceComparison({ availableVoices, onSave }: VoiceComparisonProps) {
    const [slots, setSlots] = React.useState<Array<{ id: string, voiceId?: string }>>([
        { id: "1" },
        { id: "2" }
    ])
    const [text, setText] = React.useState("The quick brown fox jumps over the lazy dog.")
    const [winnerId, setWinnerId] = React.useState<string | null>(null)

    const addSlot = () => {
        if (slots.length < 3) {
            setSlots([...slots, { id: Math.random().toString() }])
        }
    }

    const removeSlot = (id: string) => {
        setSlots(slots.filter(s => s.id !== id))
        if (winnerId === id) setWinnerId(null)
    }

    const handleVoiceChange = (slotId: string, voiceId: string) => {
        setSlots(slots.map(s => s.id === slotId ? { ...s, voiceId } : s))
    }

    const handleSave = () => {
        if (!winnerId) {
            toast.error("Please select a favorite voice first")
            return
        }

        const winner = slots.find(s => s.id === winnerId)
        if (winner && winner.voiceId) {
            onSave?.({
                winnerId: winner.voiceId,
                text,
                comparisonIds: slots.map(s => s.voiceId).filter(Boolean) as string[]
            })
            toast.success("Comparison saved!")
        }
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Voice Comparison</span>
                    <Badge variant="outline">{slots.length} / 3 Voices</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Comparison Text</Label>
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text to compare voices..."
                        className="resize-none"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {slots.map((slot) => (
                        <ComparisonSlot
                            key={slot.id}
                            voice={availableVoices.find(v => v.id === slot.voiceId)}
                            text={text}
                            isGenerating={false}
                            onGenerate={() => { }}
                            onVote={() => setWinnerId(slot.id)}
                            isWinner={winnerId === slot.id}
                            onRemove={() => removeSlot(slot.id)}
                            canRemove={slots.length > 2}
                            availableVoices={availableVoices}
                            onVoiceChange={(vid) => handleVoiceChange(slot.id, vid)}
                        />
                    ))}

                    {slots.length < 3 && (
                        <Button
                            variant="outline"
                            className="h-full min-h-[200px] border-dashed flex flex-col gap-2 hover:border-primary/50"
                            onClick={addSlot}
                        >
                            <Plus className="h-8 w-8" />
                            Add Comparison
                        </Button>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleSave} disabled={!winnerId}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preference
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
