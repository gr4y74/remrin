"use client"

import { useState, useRef, useEffect, RefObject } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Volume2, VolumeX, Play, Pause, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAudioVideoSync } from "@/hooks/useAudioVideoSync"

interface WelcomeAudioPlayerProps {
    audioUrl: string
    autoPlay?: boolean
    loop?: boolean
    onEnded?: () => void
    className?: string

    // Video sync support
    videoRef?: RefObject<HTMLVideoElement>
    enableSync?: boolean
}

export function WelcomeAudioPlayer({
    audioUrl,
    autoPlay = false,
    loop = false,
    onEnded,
    className,
    videoRef,
    enableSync = true
}: WelcomeAudioPlayerProps) {
    // Use sync hook if video ref provided, otherwise use local ref
    const syncHook = useAudioVideoSync()
    const localAudioRef = useRef<HTMLAudioElement | null>(null)

    // Use sync hook's audioRef if syncing is enabled, otherwise use local ref
    const audioRef = (videoRef && enableSync) ? syncHook.audioRef : localAudioRef

    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userInteracted, setUserInteracted] = useState(false)

    // Load preferences from localStorage
    useEffect(() => {
        const savedMuted = localStorage.getItem("remrin_audio_muted")
        if (savedMuted !== null) {
            setIsMuted(savedMuted === "true")
        }

        const handleMuteChange = (e: Event) => {
            const customEvent = e as CustomEvent
            if (customEvent.detail && typeof customEvent.detail.isMuted === 'boolean') {
                setIsMuted(customEvent.detail.isMuted)
            }
        }

        window.addEventListener('remrin-audio-mute-change', handleMuteChange)
        return () => window.removeEventListener('remrin-audio-mute-change', handleMuteChange)
    }, [])

    // Handle audio initialization
    useEffect(() => {
        if (!audioRef.current) return

        const audio = audioRef.current
        audio.volume = isMuted ? 0 : 1

        const handleCanPlay = () => {
            setIsLoading(false)
            if (autoPlay && !userInteracted && !isMuted) {
                // Attempt play only if not muted and autoplay is on
                // Browser policies might block this if not muted, but we try.
                playAudio()
            }
        }

        const handleError = () => {
            setIsLoading(false)
            setError("Failed to load audio")
        }

        const handleEnded = () => {
            if (!loop) setIsPlaying(false)
            if (onEnded) onEnded()
        }

        audio.addEventListener("canplay", handleCanPlay)
        audio.addEventListener("error", handleError)
        audio.addEventListener("ended", handleEnded)

        return () => {
            audio.removeEventListener("canplay", handleCanPlay)
            audio.removeEventListener("error", handleError)
            audio.removeEventListener("ended", handleEnded)
        }
    }, [audioUrl, autoPlay, loop, onEnded, isMuted, userInteracted])

    // Sync playing state
    useEffect(() => {
        if (!audioRef.current) return
        if (isPlaying) {
            audioRef.current.play().catch((err) => {
                console.error("Playback failed:", err)
                setIsPlaying(false)
            })
        } else {
            audioRef.current.pause()
        }
    }, [isPlaying])

    // Sync mute state
    useEffect(() => {
        if (!audioRef.current) return
        audioRef.current.muted = isMuted
        audioRef.current.volume = isMuted ? 0 : 1
        localStorage.setItem("remrin_audio_muted", String(isMuted))
    }, [isMuted])

    // Initialize video sync when videoRef is provided
    useEffect(() => {
        if (!videoRef || !enableSync || !videoRef.current || !audioRef.current) return

        // Wait for both elements to be ready
        const initSync = () => {
            if (videoRef.current && audioRef.current) {
                syncHook.syncWithVideo(videoRef)
                console.log('[WelcomeAudioPlayer] Video sync initialized')
            }
        }

        // If both are already loaded, sync immediately
        if (videoRef.current.readyState >= 2 && audioRef.current.readyState >= 2) {
            initSync()
        } else {
            // Otherwise wait for both to be ready
            const handleVideoReady = () => {
                if (audioRef.current && audioRef.current.readyState >= 2) {
                    initSync()
                }
            }

            const handleAudioReady = () => {
                if (videoRef.current && videoRef.current.readyState >= 2) {
                    initSync()
                }
            }

            videoRef.current.addEventListener('loadeddata', handleVideoReady)
            audioRef.current.addEventListener('loadeddata', handleAudioReady)

            return () => {
                videoRef.current?.removeEventListener('loadeddata', handleVideoReady)
                audioRef.current?.removeEventListener('loadeddata', handleAudioReady)
            }
        }
    }, [videoRef, enableSync, syncHook])

    const togglePlay = () => {
        setUserInteracted(true)
        setIsPlaying(!isPlaying)
    }

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation()
        setUserInteracted(true)
        setIsMuted(!isMuted)
    }

    // Keyboard shortcut (Space)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space" && !e.repeat && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
                e.preventDefault() // Prevent scrolling
                togglePlay()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isPlaying]) // Re-bind with latest isPlaying is fine, or preferably use ref or functional update if complex logic

    if (error) return null

    return (
        <TooltipProvider>
            <div className={cn("relative z-20 flex items-center gap-2", className)}>
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    loop={loop}
                    playsInline
                    preload="auto"
                />

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
                                disabled={isLoading}
                                className={cn(
                                    "size-10 rounded-full border-rp-iris/20 bg-rp-surface/40 backdrop-blur-md transition-all duration-300",
                                    "hover:bg-rp-surface/60 hover:border-rp-iris/40 hover:scale-105 hover:shadow-lg hover:shadow-rp-iris/10",
                                    "text-rp-iris active:scale-95",
                                    isPlaying && "ring-2 ring-rp-iris/20 border-rp-iris/50 bg-rp-surface/60"
                                )}
                                aria-label={isPlaying ? "Pause welcome message" : "Play welcome message"}
                            >
                                {isLoading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : isPlaying ? (
                                    <div className="flex items-center justify-center gap-[2px]">
                                        {[1, 2, 3, 4].map((i) => (
                                            <motion.div
                                                key={i}
                                                className="w-1 rounded-full bg-rp-iris"
                                                animate={{
                                                    height: [8, 16, 8],
                                                }}
                                                transition={{
                                                    duration: 0.8,
                                                    repeat: Infinity,
                                                    delay: i * 0.1,
                                                    ease: "easeInOut",
                                                }}
                                                style={{ height: 12 }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <Play className="ml-0.5 size-4 fill-current" />
                                )}
                            </Button>
                        </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-rp-surface border-rp-border text-rp-text">
                        <p>Welcome message</p>
                    </TooltipContent>
                </Tooltip>

                <AnimatePresence>
                    {isPlaying && (
                        <motion.button
                            initial={{ opacity: 0, x: -10, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: "auto" }}
                            exit={{ opacity: 0, x: -10, width: 0 }}
                            onClick={toggleMute}
                            className="text-rp-subtle hover:text-rp-text overflow-hidden pl-1 transition-colors"
                            aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? (
                                <VolumeX className="size-4" />
                            ) : (
                                <Volume2 className="size-4" />
                            )}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </TooltipProvider>
    )

    function playAudio() {
        if (!audioRef.current) return
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    setIsPlaying(true)
                })
                .catch((error) => {
                    console.log("Auto-play prevented:", error)
                    setIsPlaying(false)
                })
        }
    }
}
