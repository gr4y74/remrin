"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, Square, Volume2, VolumeX, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface BackgroundMusicPlayerProps {
    musicUrl: string
    autoPlay?: boolean
    className?: string
    compact?: boolean
}

const STORAGE_KEY_VOLUME = "remrin_bgm_volume"
const STORAGE_KEY_MUTED = "remrin_bgm_muted"

export function BackgroundMusicPlayer({
    musicUrl,
    autoPlay = false,
    className,
    compact = false,
}: BackgroundMusicPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [volume, setVolume] = useState(0.3)
    const [isLooping, setIsLooping] = useState(true)
    const [isLoaded, setIsLoaded] = useState(false)
    const [showVolume, setShowVolume] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load preferences from localStorage
    useEffect(() => {
        const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME)
        const savedMuted = localStorage.getItem(STORAGE_KEY_MUTED)
        if (savedVolume !== null) setVolume(parseFloat(savedVolume))
        if (savedMuted !== null) setIsMuted(savedMuted === "true")
    }, [])

    // Audio initialization
    useEffect(() => {
        if (!audioRef.current) return
        const audio = audioRef.current

        const handleCanPlay = () => {
            setIsLoaded(true)
            if (autoPlay && !isMuted) {
                audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
            }
        }

        const handleError = () => {
            setIsLoaded(true)
            setError("Failed to load music")
        }

        const handleEnded = () => {
            if (!isLooping) setIsPlaying(false)
        }

        audio.addEventListener("canplay", handleCanPlay)
        audio.addEventListener("error", handleError)
        audio.addEventListener("ended", handleEnded)

        return () => {
            audio.removeEventListener("canplay", handleCanPlay)
            audio.removeEventListener("error", handleError)
            audio.removeEventListener("ended", handleEnded)
        }
    }, [musicUrl, autoPlay, isLooping, isMuted])

    // Sync volume
    useEffect(() => {
        if (!audioRef.current) return
        audioRef.current.volume = isMuted ? 0 : volume
        audioRef.current.muted = isMuted
        localStorage.setItem(STORAGE_KEY_VOLUME, String(volume))
        localStorage.setItem(STORAGE_KEY_MUTED, String(isMuted))
    }, [volume, isMuted])

    // Sync loop
    useEffect(() => {
        if (audioRef.current) audioRef.current.loop = isLooping
    }, [isLooping])

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return
        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch((err) => {
                    console.error("BGM playback failed:", err)
                    setIsPlaying(false)
                })
        }
    }, [isPlaying])

    const handleStop = useCallback(() => {
        if (!audioRef.current) return
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsPlaying(false)
    }, [])

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev)
    }, [])

    const toggleLoop = useCallback(() => {
        setIsLooping(prev => !prev)
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
            }
        }
    }, [])

    if (error) return null

    return (
        <TooltipProvider>
            <div
                className={cn(
                    "relative z-20 flex items-center gap-1",
                    className
                )}
                onMouseEnter={() => setShowVolume(true)}
                onMouseLeave={() => setShowVolume(false)}
            >
                <audio
                    ref={audioRef}
                    src={musicUrl}
                    loop={isLooping}
                    playsInline
                    preload="auto"
                />

                {/* Play/Pause */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={togglePlay}
                                disabled={!isLoaded}
                                className={cn(
                                    "size-8 rounded-full border-rp-gold/20 bg-rp-surface/40 backdrop-blur-md transition-all duration-300",
                                    "hover:bg-rp-surface/60 hover:border-rp-gold/40 hover:scale-105 hover:shadow-lg hover:shadow-rp-gold/10",
                                    "text-rp-gold active:scale-95",
                                    isPlaying && "ring-2 ring-rp-gold/20 border-rp-gold/50 bg-rp-surface/60"
                                )}
                                aria-label={isPlaying ? "Pause music" : "Play music"}
                            >
                                {!isLoaded ? (
                                    <div className="size-3 animate-spin rounded-full border-2 border-rp-gold border-t-transparent" />
                                ) : isPlaying ? (
                                    <div className="flex items-center justify-center gap-[2px]">
                                        {[1, 2, 3].map((i) => (
                                            <motion.div
                                                key={i}
                                                className="w-[2px] rounded-full bg-rp-gold"
                                                animate={{
                                                    height: [4, 12, 4],
                                                }}
                                                transition={{
                                                    duration: 0.6,
                                                    repeat: Infinity,
                                                    delay: i * 0.15,
                                                    ease: "easeInOut",
                                                }}
                                                style={{ height: 8 }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <Play className="ml-0.5 size-3 fill-current" />
                                )}
                            </Button>
                        </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-rp-surface border-rp-border text-rp-text">
                        <p>{isPlaying ? "Pause" : "Play"} background music</p>
                    </TooltipContent>
                </Tooltip>

                {/* Stop */}
                <AnimatePresence>
                    {isPlaying && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, width: 0 }}
                                    animate={{ opacity: 1, scale: 1, width: "auto" }}
                                    exit={{ opacity: 0, scale: 0.8, width: 0 }}
                                    className="overflow-hidden"
                                >
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleStop}
                                        className="size-8 rounded-full border-rp-gold/20 bg-rp-surface/40 backdrop-blur-md text-rp-gold hover:bg-rp-surface/60 hover:border-rp-gold/40"
                                        aria-label="Stop music"
                                    >
                                        <Square className="size-3 fill-current" />
                                    </Button>
                                </motion.div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="bg-rp-surface border-rp-border text-rp-text">
                                <p>Stop</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </AnimatePresence>

                {/* Loop Toggle */}
                <AnimatePresence>
                    {isPlaying && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, width: 0 }}
                                    animate={{ opacity: 1, scale: 1, width: "auto" }}
                                    exit={{ opacity: 0, scale: 0.8, width: 0 }}
                                    className="overflow-hidden"
                                >
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={toggleLoop}
                                        className={cn(
                                            "size-8 rounded-full border-rp-gold/20 bg-rp-surface/40 backdrop-blur-md text-rp-gold hover:bg-rp-surface/60 hover:border-rp-gold/40",
                                            isLooping && "ring-1 ring-rp-gold/30 bg-rp-gold/10"
                                        )}
                                        aria-label={isLooping ? "Disable loop" : "Enable loop"}
                                    >
                                        <Repeat className="size-3" />
                                    </Button>
                                </motion.div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="bg-rp-surface border-rp-border text-rp-text">
                                <p>{isLooping ? "Loop on" : "Loop off"}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </AnimatePresence>

                {/* Volume */}
                <AnimatePresence>
                    {(isPlaying || showVolume) && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex items-center gap-1 overflow-hidden"
                        >
                            <button
                                onClick={toggleMute}
                                className="text-rp-gold/70 hover:text-rp-gold transition-colors p-1"
                                aria-label={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? (
                                    <VolumeX className="size-3" />
                                ) : (
                                    <Volume2 className="size-3" />
                                )}
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
                                    className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-rp-surface accent-rp-gold"
                                    aria-label="Volume"
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </TooltipProvider>
    )
}
