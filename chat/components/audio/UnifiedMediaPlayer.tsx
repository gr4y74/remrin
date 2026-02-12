"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Volume2,
    VolumeX,
    Music,
    Mic,
    ListMusic,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export interface AudioTrack {
    id: string
    name: string
    url: string
    type: 'welcome' | 'music' | 'other'
}

interface UnifiedMediaPlayerProps {
    tracks: AudioTrack[]
    autoPlay?: boolean
    className?: string
    compact?: boolean
    onTrackChange?: (track: AudioTrack) => void
}

const STORAGE_KEY_VOLUME = "remrin_unified_volume"
const STORAGE_KEY_MUTED = "remrin_unified_muted"

export function UnifiedMediaPlayer({
    tracks,
    autoPlay = false,
    className,
    compact = false,
    onTrackChange
}: UnifiedMediaPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [volume, setVolume] = useState(0.5)
    const [isLoaded, setIsLoaded] = useState(false)
    const [showVolume, setShowVolume] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const currentTrack = useMemo(() => tracks[currentTrackIndex], [tracks, currentTrackIndex])

    // Load preferences from localStorage
    useEffect(() => {
        const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME)
        const savedMuted = localStorage.getItem(STORAGE_KEY_MUTED)
        if (savedVolume !== null) setVolume(parseFloat(savedVolume))
        if (savedMuted !== null) setIsMuted(savedMuted === "true")
    }, [])

    // Audio initialization
    useEffect(() => {
        if (!audioRef.current || !currentTrack) return
        const audio = audioRef.current
        setIsLoaded(false)
        setError(null)

        const handleCanPlay = () => {
            setIsLoaded(true)
            if (autoPlay && isPlaying) {
                audio.play().catch(() => setIsPlaying(false))
            }
        }

        const handleError = () => {
            setIsLoaded(true)
            setError("Failed to load track")
        }

        const handleEnded = () => {
            handleNext()
        }

        audio.addEventListener("canplay", handleCanPlay)
        audio.addEventListener("error", handleError)
        audio.addEventListener("ended", handleEnded)

        return () => {
            audio.removeEventListener("canplay", handleCanPlay)
            audio.removeEventListener("error", handleError)
            audio.removeEventListener("ended", handleEnded)
        }
    }, [currentTrack, autoPlay])

    // Sync volume
    useEffect(() => {
        if (!audioRef.current) return
        audioRef.current.volume = isMuted ? 0 : volume
        audioRef.current.muted = isMuted
        localStorage.setItem(STORAGE_KEY_VOLUME, String(volume))
        localStorage.setItem(STORAGE_KEY_MUTED, String(isMuted))
    }, [volume, isMuted])

    const togglePlay = useCallback(() => {
        if (!audioRef.current || !isLoaded) return
        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch((err) => {
                    console.error("Playback failed:", err)
                    setIsPlaying(false)
                })
        }
    }, [isPlaying, isLoaded])

    const handleNext = useCallback(() => {
        const nextIndex = (currentTrackIndex + 1) % tracks.length
        setCurrentTrackIndex(nextIndex)
        if (onTrackChange) onTrackChange(tracks[nextIndex])
    }, [currentTrackIndex, tracks, onTrackChange])

    const handlePrev = useCallback(() => {
        const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length
        setCurrentTrackIndex(prevIndex)
        if (onTrackChange) onTrackChange(tracks[prevIndex])
    }, [currentTrackIndex, tracks, onTrackChange])

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev)
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
            }
        }
    }, [])

    if (!currentTrack) return null

    return (
        <TooltipProvider>
            <div
                className={cn(
                    "relative z-20 flex items-center gap-2 bg-rp-surface/20 hover:bg-rp-surface/40 backdrop-blur-md rounded-full px-2 py-1 transition-all group",
                    className
                )}
                onMouseEnter={() => setShowVolume(true)}
                onMouseLeave={() => setShowVolume(false)}
            >
                <audio
                    ref={audioRef}
                    src={currentTrack.url}
                    playsInline
                    preload="auto"
                />

                {/* Track Icon Indicator */}
                <div className="size-8 rounded-full bg-rp-base/40 flex items-center justify-center text-rp-text/50">
                    {currentTrack.type === 'welcome' ? (
                        <Mic className="size-4" />
                    ) : (
                        <Music className="size-4" />
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrev}
                        disabled={tracks.length <= 1}
                        className="size-7 rounded-full text-rp-text/60 hover:text-rp-text hover:bg-white/5"
                    >
                        <SkipBack className="size-3" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={togglePlay}
                        disabled={!isLoaded}
                        className={cn(
                            "size-8 rounded-full border-rp-iris/20 bg-rp-surface/40 backdrop-blur-md transition-all duration-300",
                            "hover:bg-rp-surface/60 hover:border-rp-iris/40 hover:scale-105 hover:shadow-lg hover:shadow-rp-iris/10",
                            "text-rp-iris active:scale-95",
                            isPlaying && "ring-2 ring-rp-iris/20 border-rp-iris/50 bg-rp-surface/60"
                        )}
                    >
                        {!isLoaded ? (
                            <Loader2 className="size-3 animate-spin" />
                        ) : isPlaying ? (
                            <Pause className="size-3 fill-current" />
                        ) : (
                            <Play className="ml-0.5 size-3 fill-current" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNext}
                        disabled={tracks.length <= 1}
                        className="size-7 rounded-full text-rp-text/60 hover:text-rp-text hover:bg-white/5"
                    >
                        <SkipForward className="size-3" />
                    </Button>
                </div>

                {/* Volume Control */}
                <AnimatePresence>
                    {(isPlaying || showVolume) && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex items-center gap-2 overflow-hidden"
                        >
                            <button
                                onClick={toggleMute}
                                className="text-rp-subtle hover:text-rp-text transition-colors"
                            >
                                {isMuted ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
                            </button>

                            {!compact && (
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value)
                                        setVolume(val)
                                        if (val > 0 && isMuted) setIsMuted(false)
                                    }}
                                    className="h-1 w-12 cursor-pointer appearance-none rounded-full bg-rp-base accent-rp-iris"
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Track Info Tooltip */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="ml-1 cursor-default">
                            <ListMusic className="size-3 text-rp-muted hover:text-rp-iris transition-colors" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-rp-surface border-rp-overlay p-2">
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-rp-text">{currentTrack.name}</p>
                            <p className="text-[10px] text-rp-muted uppercase tracking-tighter">Track {currentTrackIndex + 1} of {tracks.length}</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    )
}
