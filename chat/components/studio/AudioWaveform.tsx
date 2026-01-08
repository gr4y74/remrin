"use client"

import * as React from "react"
import WaveSurfer from "wavesurfer.js"
import { Play, Pause, ZoomIn, ZoomOut, Volume2, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface AudioWaveformProps {
    url: string | null
    onFinish?: () => void
    height?: number
    className?: string
    isDark?: boolean
}

export function AudioWaveform({
    url,
    onFinish,
    height = 100,
    className,
    isDark = true
}: AudioWaveformProps) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const wavesurferRef = React.useRef<WaveSurfer | null>(null)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [duration, setDuration] = React.useState(0)
    const [currentTime, setCurrentTime] = React.useState(0)
    const [zoom, setZoom] = React.useState(1)
    const [volume, setVolume] = React.useState(1)
    const [isMuted, setIsMuted] = React.useState(false)
    const [isReady, setIsReady] = React.useState(false)

    React.useEffect(() => {
        if (!containerRef.current) return

        const ctx = document.createElement('canvas').getContext('2d')
        const gradient = ctx!.createLinearGradient(0, 0, 0, height)

        // Rose Pine colors
        gradient.addColorStop(0, "rgb(235, 188, 186)") // Rose
        gradient.addColorStop(0.5, "rgb(196, 167, 231)") // Iris
        gradient.addColorStop(1, "rgb(49, 116, 143)") // Pine

        const ws = WaveSurfer.create({
            container: containerRef.current,
            height,
            waveColor: "rgba(110, 106, 134, 0.5)", // Muted
            progressColor: gradient,
            cursorColor: "rgb(246, 193, 119)", // Gold
            barWidth: 2,
            barGap: 3,
            normalize: true,
            minPxPerSec: 50,
            fillParent: true,
        })

        ws.on('ready', () => {
            setIsReady(true)
            setDuration(ws.getDuration())
        })

        ws.on('audioprocess', () => {
            setCurrentTime(ws.getCurrentTime())
        })

        ws.on('finish', () => {
            setIsPlaying(false)
            onFinish?.()
        })

        ws.on('play', () => setIsPlaying(true))
        ws.on('pause', () => setIsPlaying(false))

        wavesurferRef.current = ws

        return () => {
            ws.destroy()
        }
    }, [height, onFinish])

    // Load new URL
    React.useEffect(() => {
        if (url && wavesurferRef.current) {
            setIsReady(false)
            wavesurferRef.current.load(url)
        }
    }, [url])

    const handlePlayPause = () => {
        wavesurferRef.current?.playPause()
    }

    const handleZoom = (delta: number) => {
        const newZoom = Math.max(1, Math.min(zoom + delta, 100))
        setZoom(newZoom)
        wavesurferRef.current?.zoom(newZoom * 50)
    }

    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume)
        if (wavesurferRef.current) {
            wavesurferRef.current.setVolume(isMuted ? 0 : newVolume)
        }
    }

    const toggleMute = () => {
        const newMuted = !isMuted
        setIsMuted(newMuted)
        wavesurferRef.current?.setVolume(newMuted ? 0 : volume)
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    if (!url) {
        return (
            <div className={cn(
                "flex items-center justify-center rounded-lg border border-dashed text-muted-foreground",
                "h-[160px] w-full",
                className
            )}>
                No audio generated yet
            </div>
        )
    }

    return (
        <div className={cn("space-y-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm", className)}>
            <div ref={containerRef} className="w-full" />

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePlayPause}
                        disabled={!isReady}
                        className="h-10 w-10 shrink-0"
                    >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>

                    <div className="text-sm font-medium tabular-nums text-muted-foreground">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 max-md:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleZoom(-1)}
                            disabled={!isReady || zoom <= 1}
                            className="h-8 w-8"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground w-8 text-center">{zoom}x</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleZoom(1)}
                            disabled={!isReady || zoom >= 100}
                            className="h-8 w-8"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMute}
                            className="h-8 w-8"
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX className="h-4 w-4" />
                            ) : (
                                <Volume2 className="h-4 w-4" />
                            )}
                        </Button>
                        <Slider
                            value={[isMuted ? 0 : volume]}
                            max={1}
                            step={0.1}
                            onValueChange={([val]) => handleVolumeChange(val)}
                            className="w-20"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
