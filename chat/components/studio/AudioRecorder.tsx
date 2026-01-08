"use client"

import * as React from "react"
import { Mic, Square, RotateCcw, Trash2, StopCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AudioWaveform } from "./AudioWaveform"

interface AudioRecorderProps {
    onRecordingComplete: (blob: Blob) => void
    maxDuration?: number // seconds
    className?: string
}

export function AudioRecorder({
    onRecordingComplete,
    maxDuration = 60,
    className
}: AudioRecorderProps) {
    const [isRecording, setIsRecording] = React.useState(false)
    const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = React.useState<string | null>(null)
    const [duration, setDuration] = React.useState(0)

    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
    const chunksRef = React.useRef<Blob[]>([])
    const timerRef = React.useRef<NodeJS.Timeout | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const animationFrameRef = React.useRef<number | null>(null)
    const audioContextRef = React.useRef<AudioContext | null>(null)
    const analyserRef = React.useRef<AnalyserNode | null>(null)
    const sourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null)

    React.useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl)
            if (timerRef.current) clearInterval(timerRef.current)
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            if (audioContextRef.current) audioContextRef.current.close()
        }
    }, [audioUrl])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            mediaRecorderRef.current = new MediaRecorder(stream)
            chunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' }) // or audio/webm
                setAudioBlob(blob)
                onRecordingComplete(blob)

                const url = URL.createObjectURL(blob)
                setAudioUrl(url)

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())

                // Stop visualization
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
            setDuration(0)

            // Timer
            timerRef.current = setInterval(() => {
                setDuration(prev => {
                    if (prev >= maxDuration) {
                        stopRecording()
                        return prev
                    }
                    return prev + 1
                })
            }, 1000)

            // Visualization
            setupVisualization(stream)

        } catch (err) {
            console.error("Error accessing microphone:", err)
            toast.error("Could not access microphone. Please check permissions.")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const resetRecording = () => {
        setAudioBlob(null)
        setAudioUrl(null)
        setDuration(0)
        setIsRecording(false)
    }

    const setupVisualization = (stream: MediaStream) => {
        if (!canvasRef.current) return

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext
        const analyser = audioContext.createAnalyser()
        analyserRef.current = analyser
        analyser.fftSize = 256

        const source = audioContext.createMediaStreamSource(stream)
        sourceRef.current = source
        source.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw)
            analyser.getByteFrequencyData(dataArray)

            ctx.fillStyle = 'rgb(25, 23, 36)' // Base
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            const barWidth = (canvas.width / bufferLength) * 2.5
            let barHeight
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2

                // Gradient based on height
                const r = 235 // Rose
                const g = 188 - (barHeight / 2)
                const b = 186

                ctx.fillStyle = `rgb(${r},${g},${b})`
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

                x += barWidth + 1
            }
        }

        draw()
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = time % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <div className={cn("space-y-4", className)}>
            {!audioUrl && !isRecording && (
                <div
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={startRecording}
                >
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                        <Mic className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-medium">Click to Record</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Max duration: {formatTime(maxDuration)}
                    </p>
                </div>
            )}

            {isRecording && (
                <div className="rounded-lg border bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                            <span className="font-medium text-red-500">Recording...</span>
                        </div>
                        <span className="font-mono tabular-nums">{formatTime(duration)}</span>
                    </div>

                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={100}
                        className="w-full h-[100px] rounded bg-muted/20"
                    />

                    <Button
                        onClick={stopRecording}
                        variant="destructive"
                        className="w-full"
                    >
                        <StopCircle className="mr-2 h-4 w-4" />
                        Stop Recording
                    </Button>
                </div>
            )}

            {audioUrl && !isRecording && (
                <div className="space-y-4">
                    <AudioWaveform url={audioUrl} />

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetRecording}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Discard
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetRecording}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Record Again
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
