/**
 * Call Modal - Voice Call Interface
 * 
 * Character.AI-style voice call experience with full-screen overlay
 * Uses AI TTS (ElevenLabs/OpenAI) for high-quality voice synthesis
 */

"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { IconMicrophone, IconMicrophoneOff, IconPhoneOff } from '@tabler/icons-react'
import Image from 'next/image'

interface CallModalProps {
    isOpen: boolean
    onClose: () => void
    personaName?: string
    personaImage?: string
    personaVoiceId?: string // ElevenLabs voice ID
    onSendMessage?: (message: string) => Promise<string | undefined>
}

type CallStatus = 'connecting' | 'listening' | 'processing' | 'speaking' | 'idle'

interface AudioQueueItem {
    text: string
    audioUrl?: string
}

export function CallModal({
    isOpen,
    onClose,
    personaName = "Character",
    personaImage,
    personaVoiceId,
    onSendMessage
}: CallModalProps) {
    const [isMuted, setIsMuted] = useState(false)
    const [status, setStatus] = useState<CallStatus>('connecting')
    const [transcript, setTranscript] = useState('')
    const [audioQueue, setAudioQueue] = useState<AudioQueueItem[]>([])
    const [isProcessingQueue, setIsProcessingQueue] = useState(false)

    const recognitionRef = useRef<any>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)

    // Use refs to avoid stale closure issues
    const isMutedRef = useRef(isMuted)
    const isOpenRef = useRef(isOpen)
    const statusRef = useRef(status)

    // Keep refs in sync
    useEffect(() => { isMutedRef.current = isMuted }, [isMuted])
    useEffect(() => { isOpenRef.current = isOpen }, [isOpen])
    useEffect(() => { statusRef.current = status }, [status])

    // Initialize audio context
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            audioRef.current = new Audio()
        }
        return () => {
            audioContextRef.current?.close()
        }
    }, [])


    const handleUserMessage = useCallback(async (message: string) => {
        setStatus('processing')
        setTranscript('')

        if (onSendMessage) {
            try {
                const response = await onSendMessage(message)
                if (response) {
                    // Add to audio queue
                    setAudioQueue(prev => [...prev, { text: response }])
                } else {
                    setStatus('listening')
                }
            } catch (error) {
                console.error('Error sending message:', error)
                setStatus('listening')
            }
        } else {
            // Demo mode - simulate response
            setTimeout(() => {
                setAudioQueue(prev => [...prev, { text: `I heard you say: ${message}` }])
            }, 1000)
        }
    }, [onSendMessage])

    const startListening = useCallback(() => {
        // Check browser support
        if (typeof window === 'undefined') return

        const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition

        if (!SpeechRecognitionAPI) {
            console.error('Speech recognition not supported in this browser')
            setStatus('idle')
            return
        }

        try {
            const recognition = new SpeechRecognitionAPI()

            recognition.continuous = false
            recognition.interimResults = true
            recognition.lang = 'en-US'

            recognition.onstart = () => {
                console.log('[CallModal] Speech recognition started')
                setStatus('listening')
            }

            recognition.onresult = (event: any) => {
                let finalTranscript = ''
                let interimTranscript = ''

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i]
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript
                    } else {
                        interimTranscript += result[0].transcript
                    }
                }

                setTranscript(finalTranscript || interimTranscript)
                console.log('[CallModal] Transcript:', finalTranscript || interimTranscript)

                if (finalTranscript) {
                    handleUserMessage(finalTranscript)
                }
            }

            recognition.onerror = (event: any) => {
                console.error('[CallModal] Speech recognition error:', event.error)
                // Don't set idle for recoverable errors
                if (event.error !== 'aborted' && event.error !== 'no-speech') {
                    setStatus('idle')
                }
            }

            recognition.onend = () => {
                console.log('[CallModal] Speech recognition ended. Muted:', isMutedRef.current, 'Open:', isOpenRef.current, 'Status:', statusRef.current)
                // Restart listening if conditions are right
                if (!isMutedRef.current && isOpenRef.current && statusRef.current !== 'processing' && statusRef.current !== 'speaking') {
                    setTimeout(() => {
                        if (!isMutedRef.current && isOpenRef.current) {
                            startListening()
                        }
                    }, 500)
                }
            }

            recognitionRef.current = recognition
            recognition.start()
            console.log('[CallModal] Speech recognition starting...')
        } catch (error) {
            console.error('[CallModal] Failed to start speech recognition:', error)
            setStatus('idle')
        }
    }, [handleUserMessage])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.abort()
            recognitionRef.current = null
        }
    }, [])

    // Start listening when call opens
    useEffect(() => {
        if (isOpen && !isMuted) {
            // Small delay to ensure modal is fully rendered
            const timer = setTimeout(() => {
                startListening()
            }, 500)
            return () => clearTimeout(timer)
        }
        return () => {
            stopListening()
            // Stop audio playback
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.src = ''
            }
            // Clear audio queue
            setAudioQueue([])
            setIsProcessingQueue(false)
        }
    }, [isOpen, isMuted, startListening, stopListening])



    // Process audio queue
    useEffect(() => {
        if (audioQueue.length > 0 && !isProcessingQueue) {
            processNextInQueue()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioQueue, isProcessingQueue])

    const processNextInQueue = async () => {
        if (audioQueue.length === 0 || isProcessingQueue) return

        setIsProcessingQueue(true)
        const item = audioQueue[0]

        try {
            await speakWithTTS(item.text)
        } catch (error) {
            console.error('Error playing audio:', error)
        } finally {
            // Remove processed item
            setAudioQueue(prev => prev.slice(1))
            setIsProcessingQueue(false)

            // Resume listening if not muted
            if (!isMutedRef.current && isOpenRef.current && audioQueue.length === 1) {
                setStatus('listening')
                startListening()
            }
        }
    }

    const speakWithTTS = async (text: string): Promise<void> => {
        if (!audioRef.current) return

        setStatus('speaking')

        try {
            // Call TTS API
            const response = await fetch('/api/tts/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    voiceId: personaVoiceId,
                    provider: personaVoiceId ? 'elevenlabs' : 'auto',
                }),
            })

            if (!response.ok) {
                throw new Error(`TTS API error: ${response.status}`)
            }

            // Get audio blob
            const audioBlob = await response.blob()
            const audioUrl = URL.createObjectURL(audioBlob)

            // Play audio
            return new Promise((resolve, reject) => {
                if (!audioRef.current) {
                    reject(new Error('Audio element not available'))
                    return
                }

                audioRef.current.src = audioUrl
                audioRef.current.onended = () => {
                    URL.revokeObjectURL(audioUrl)
                    resolve()
                }
                audioRef.current.onerror = () => {
                    URL.revokeObjectURL(audioUrl)
                    reject(new Error('Audio playback failed'))
                }

                audioRef.current.play().catch(reject)
            })
        } catch (error) {
            console.error('TTS error:', error)
            throw error
        }
    }

    const toggleMute = () => {
        if (isMuted) {
            setIsMuted(false)
            startListening()
        } else {
            setIsMuted(true)
            stopListening()
            setStatus('idle')
        }
    }

    const handleHangUp = () => {
        stopListening()
        // Stop audio playback
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ''
        }
        // Clear queue
        setAudioQueue([])
        setIsProcessingQueue(false)
        onClose()
    }

    const getStatusText = () => {
        switch (status) {
            case 'connecting': return 'Connecting...'
            case 'listening': return 'Listening'
            case 'processing': return 'Thinking...'
            case 'speaking': return 'Speaking'
            case 'idle': return isMuted ? 'Muted' : 'Ready'
            default: return ''
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between py-12 md:py-16 px-6 md:px-8">
            {/* Radial gradient background */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: 'radial-gradient(ellipse at 50% 30%, rgba(196, 167, 231, 0.25) 0%, rgba(23, 114, 180, 0.1) 30%, rgb(17, 17, 20) 60%)'
                }}
            />

            {/* Character Section - Larger on mobile */}
            <div className="relative z-10 flex flex-col items-center gap-6 mt-8 md:mt-8">
                {/* Avatar with pulse effect when listening/speaking - Bigger on mobile */}
                <div className={`relative ${status === 'listening' || status === 'speaking' ? 'animate-pulse' : ''}`}>
                    <div className="size-48 md:size-36 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
                        {personaImage ? (
                            <Image
                                src={personaImage}
                                alt={personaName}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-rp-iris to-rp-love flex items-center justify-center">
                                <span className="text-5xl md:text-4xl font-bold text-white">{personaName.charAt(0)}</span>
                            </div>
                        )}
                    </div>

                    {/* Animated rings when active */}
                    {(status === 'listening' || status === 'speaking') && (
                        <>
                            <div className="absolute inset-0 rounded-full border-2 border-rp-iris/50 animate-ping" />
                            <div className="absolute -inset-3 rounded-full border border-rp-iris/30 animate-pulse" />
                        </>
                    )}
                </div>

                {/* Character Name */}
                <div className="text-center">
                    <p className="text-white/70 text-base md:text-sm mb-1">{personaName}</p>
                    <p className="text-white text-3xl md:text-2xl font-bold tracking-tight">remrin</p>
                </div>
            </div>

            {/* Status Section */}
            <div className="relative z-10 flex flex-col items-center gap-4 flex-1 justify-center">
                <p className="text-white/90 text-xl md:text-lg font-medium">{getStatusText()}</p>

                {/* Waveform when speaking */}
                {status === 'speaking' && (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 h-8">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-[#c4a7e7] rounded-full animate-pulse"
                                    style={{
                                        height: `${Math.max(40, Math.random() * 100)}%`,
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Transcript preview */}
                {transcript && (
                    <p className="text-white/60 text-base md:text-sm max-w-xs text-center italic">
                        &ldquo;{transcript}&rdquo;
                    </p>
                )}
            </div>

            {/* Controls Section - Larger touch targets on mobile */}
            <div className="relative z-10 flex items-center gap-12 md:gap-8 pb-safe-area-inset-bottom">
                {/* Mute Button */}
                <div className="flex flex-col items-center gap-3 md:gap-2">
                    <button
                        onClick={toggleMute}
                        className={`size-16 md:size-14 rounded-full flex items-center justify-center transition-all touch-manipulation active:scale-95 ${isMuted
                            ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50'
                            : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        {isMuted ? <IconMicrophoneOff size={28} /> : <IconMicrophone size={28} />}
                    </button>
                    <span className="text-white/70 text-sm font-light">
                        {isMuted ? 'Unmute' : 'Mute'}
                    </span>
                </div>

                {/* Hang Up Button */}
                <div className="flex flex-col items-center gap-3 md:gap-2">
                    <button
                        onClick={handleHangUp}
                        className="size-16 md:size-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 touch-manipulation active:scale-95"
                    >
                        <IconPhoneOff size={28} />
                    </button>
                    <span className="text-white/70 text-sm font-light">Hang up</span>
                </div>
            </div>
        </div>
    )
}
