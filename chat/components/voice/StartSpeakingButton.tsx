"use client"

import { Button } from "@/components/ui/button"
import { useTTS } from "@/lib/hooks/use-tts"
import { Volume2, Loader2, StopCircle } from "lucide-react"

interface StartSpeakingButtonProps {
    text: string
    voiceId?: string
    className?: string
}

export function StartSpeakingButton({ text, voiceId, className }: StartSpeakingButtonProps) {
    const { speak, stop, isPlaying, isLoading } = useTTS({
        voiceId,
        onError: (err) => console.warn("TTS Error:", err)
    })

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent triggering parent card clicks
        if (isPlaying) {
            stop()
        } else {
            speak(text)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className={`hover:bg-rp-iris/20 rounded-full ${className}`}
            onClick={handleClick}
            disabled={isLoading || !text}
            title={isPlaying ? "Stop Speaking" : "Read Aloud"}
        >
            {isLoading ? (
                <Loader2 className="size-4 text-rp-iris animate-spin" />
            ) : isPlaying ? (
                <StopCircle className="size-4 animate-pulse text-rp-love" />
            ) : (
                <Volume2 className="size-4 hover:text-rp-iris text-rp-subtle" />
            )}
        </Button>
    )
}
