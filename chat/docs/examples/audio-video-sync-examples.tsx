/**
 * Audio/Video Synchronization Examples
 * 
 * This file demonstrates various usage patterns for the audio/video sync system.
 * Copy and adapt these examples for your own implementations.
 */

import React, { useRef, useEffect, useState } from 'react'
import { WelcomeAudioPlayer } from '@/components/audio/WelcomeAudioPlayer'
import { useAudioVideoSync } from '@/hooks/useAudioVideoSync'
import { AudioSyncManager } from '@/lib/audio/AudioSyncManager'

// Example 1: Basic Welcome Audio (No Sync)
export function Example1_BasicAudio({ audioUrl }: { audioUrl: string }) {
    return (
        <WelcomeAudioPlayer
            audioUrl={audioUrl}
            autoPlay={true}
            loop={true}
            className="fixed bottom-4 right-4"
        />
    )
}

// Example 2: Synced with Video Background
export function Example2_SyncedWithVideo({
    audioUrl,
    videoUrl
}: {
    audioUrl: string
    videoUrl: string
}) {
    const videoRef = useRef<HTMLVideoElement>(null)

    return (
        <div className="relative h-screen w-full">
            {/* Background video */}
            <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
            />

            {/* Synced audio player - positioned over video */}
            <WelcomeAudioPlayer
                audioUrl={audioUrl}
                videoRef={videoRef}
                enableSync={true}
                autoPlay={true}
                loop={true}
                className="absolute bottom-6 right-6 z-10"
            />
        </div>
    )
}

// Example 3: Using the Hook Directly
export function Example3_CustomHook({
    audioUrl,
    videoUrl
}: {
    audioUrl: string
    videoUrl: string
}) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const {
        audioRef,
        syncWithVideo,
        isPlaying,
        isSynced,
        drift,
        loopCount,
        resetSync
    } = useAudioVideoSync()

    useEffect(() => {
        if (videoRef.current) {
            syncWithVideo(videoRef)
        }
    }, [syncWithVideo])

    return (
        <div className="space-y-4">
            <div className="relative aspect-video">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full rounded-lg"
                />
            </div>

            <audio ref={audioRef} src={audioUrl} loop />

            {/* Custom controls with sync status */}
            <div className="rounded-lg bg-rp-surface p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-rp-subtle">Playing:</span>
                        <span className="ml-2 text-rp-text">
                            {isPlaying ? '▶️ Yes' : '⏸️ No'}
                        </span>
                    </div>
                    <div>
                        <span className="text-rp-subtle">Synced:</span>
                        <span className="ml-2 text-rp-text">
                            {isSynced ? '✅ Yes' : '❌ No'}
                        </span>
                    </div>
                    <div>
                        <span className="text-rp-subtle">Drift:</span>
                        <span className="ml-2 text-rp-text">
                            {(drift * 1000).toFixed(0)}ms
                        </span>
                    </div>
                    <div>
                        <span className="text-rp-subtle">Loops:</span>
                        <span className="ml-2 text-rp-text">{loopCount}</span>
                    </div>
                </div>

                <button
                    onClick={resetSync}
                    className="mt-4 rounded bg-rp-iris px-4 py-2 text-sm text-white hover:bg-rp-iris/90"
                >
                    Reset Sync
                </button>
            </div>
        </div>
    )
}

// Example 4: Manual Sync Manager Control
export function Example4_ManualControl({
    audioUrl,
    videoUrl
}: {
    audioUrl: string
    videoUrl: string
}) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const syncManagerRef = useRef<AudioSyncManager | null>(null)
    const [loopCount, setLoopCount] = useState(0)

    useEffect(() => {
        const manager = new AudioSyncManager()
        syncManagerRef.current = manager

        if (audioRef.current && videoRef.current) {
            // Initialize sync
            manager.syncAudioWithVideo(audioRef.current, videoRef.current)

            // Listen for loop events
            const loopCallback = (count: number) => {
                setLoopCount(count)
                console.log(`Video looped! Count: ${count}`)
            }
            manager.handleVideoLoop(loopCallback)
        }

        return () => {
            manager.destroy()
        }
    }, [])

    const handleReset = () => {
        syncManagerRef.current?.resetSync()
        setLoopCount(0)
    }

    const handleGetState = () => {
        const state = syncManagerRef.current?.getSyncState()
        console.log('Sync State:', state)
        alert(JSON.stringify(state, null, 2))
    }

    return (
        <div className="space-y-4">
            <div className="relative aspect-video">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full rounded-lg"
                />
            </div>

            <audio ref={audioRef} src={audioUrl} loop />

            <div className="flex gap-2">
                <button
                    onClick={handleReset}
                    className="rounded bg-rp-iris px-4 py-2 text-sm text-white"
                >
                    Reset Sync
                </button>
                <button
                    onClick={handleGetState}
                    className="rounded bg-rp-foam px-4 py-2 text-sm text-rp-base"
                >
                    Get State
                </button>
            </div>

            <p className="text-sm text-rp-subtle">Loop count: {loopCount}</p>
        </div>
    )
}

// Example 5: Character Page Integration
export function Example5_CharacterPage({
    persona
}: {
    persona: {
        name: string
        video_url?: string
        image_url?: string
        welcome_audio_url?: string
    }
}) {
    const videoRef = useRef<HTMLVideoElement>(null)

    return (
        <div className="relative min-h-screen">
            {/* Hero Section */}
            <div className="relative h-[60vh]">
                {/* Video or Image Background */}
                {persona.video_url ? (
                    <video
                        ref={videoRef}
                        src={persona.video_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <img
                        src={persona.image_url}
                        alt={persona.name}
                        className="h-full w-full object-cover"
                    />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-rp-base via-rp-base/50 to-transparent" />

                {/* Welcome Audio Player - Only if audio exists */}
                {persona.welcome_audio_url && (
                    <WelcomeAudioPlayer
                        audioUrl={persona.welcome_audio_url}
                        videoRef={persona.video_url ? videoRef : undefined}
                        enableSync={!!persona.video_url}
                        autoPlay={true}
                        loop={true}
                        className="absolute bottom-6 right-6"
                    />
                )}
            </div>

            {/* Character Info */}
            <div className="relative z-10 -mt-20 px-4">
                <h1 className="text-4xl font-bold text-rp-text">{persona.name}</h1>
                {/* Rest of character page content... */}
            </div>
        </div>
    )
}

// Example 6: Conditional Sync (Enable/Disable)
export function Example6_ConditionalSync({
    audioUrl,
    videoUrl,
    enableVideoSync
}: {
    audioUrl: string
    videoUrl: string
    enableVideoSync: boolean
}) {
    const videoRef = useRef<HTMLVideoElement>(null)

    return (
        <div className="space-y-4">
            <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="aspect-video w-full rounded-lg"
            />

            {/* Sync can be toggled on/off */}
            <WelcomeAudioPlayer
                audioUrl={audioUrl}
                videoRef={videoRef}
                enableSync={enableVideoSync}
                autoPlay={true}
                loop={true}
            />

            <p className="text-sm text-rp-subtle">
                Sync is {enableVideoSync ? 'enabled' : 'disabled'}
            </p>
        </div>
    )
}

// Example 7: Error Handling
export function Example7_ErrorHandling({
    audioUrl,
    videoUrl
}: {
    audioUrl: string
    videoUrl: string
}) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [videoError, setVideoError] = useState(false)
    const [audioError, setAudioError] = useState(false)

    return (
        <div className="space-y-4">
            {!videoError ? (
                <video
                    ref={videoRef}
                    src={videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => setVideoError(true)}
                    className="aspect-video w-full rounded-lg"
                />
            ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-rp-surface">
                    <p className="text-rp-subtle">Failed to load video</p>
                </div>
            )}

            {!audioError ? (
                <WelcomeAudioPlayer
                    audioUrl={audioUrl}
                    videoRef={!videoError ? videoRef : undefined}
                    enableSync={!videoError}
                    autoPlay={true}
                    loop={true}
                    onEnded={() => console.log('Audio ended')}
                />
            ) : (
                <p className="text-sm text-rp-love">Failed to load audio</p>
            )}
        </div>
    )
}
