/**
 * useAudioVideoSync Hook
 * 
 * Custom React hook for easy audio/video synchronization.
 * Manages AudioSyncManager lifecycle and provides a clean API
 * for components to sync audio with video elements.
 * 
 * Features:
 * - Automatic cleanup on unmount
 * - Playback state tracking
 * - Sync state tracking
 * - Imperative sync control
 * 
 * @example
 * const { audioRef, syncWithVideo, isPlaying, isSynced } = useAudioVideoSync()
 * 
 * <audio ref={audioRef} src={audioUrl} />
 * <video ref={videoRef} src={videoUrl} />
 * 
 * useEffect(() => {
 *   if (videoRef.current) {
 *     syncWithVideo(videoRef)
 *   }
 * }, [videoRef, syncWithVideo])
 */

import { useRef, useCallback, useEffect, useState, RefObject } from 'react'
import { AudioSyncManager, SyncState } from '@/lib/audio/AudioSyncManager'

export interface UseAudioVideoSyncReturn {
    /** Reference to attach to audio element */
    audioRef: RefObject<HTMLAudioElement>

    /** Function to sync audio with a video element */
    syncWithVideo: (videoRef: RefObject<HTMLVideoElement>) => void

    /** Current playback state */
    isPlaying: boolean

    /** Current sync state */
    isSynced: boolean

    /** Current drift in seconds */
    drift: number

    /** Number of times video has looped */
    loopCount: number

    /** Reset sync state */
    resetSync: () => void

    /** Get full sync state */
    getSyncState: () => SyncState | null
}

export function useAudioVideoSync(): UseAudioVideoSyncReturn {
    const audioRef = useRef<HTMLAudioElement>(null)
    const syncManagerRef = useRef<AudioSyncManager | null>(null)
    const videoRefCache = useRef<RefObject<HTMLVideoElement> | null>(null)

    // State tracking
    const [isPlaying, setIsPlaying] = useState(false)
    const [isSynced, setIsSynced] = useState(false)
    const [drift, setDrift] = useState(0)
    const [loopCount, setLoopCount] = useState(0)

    // Initialize sync manager on first mount
    useEffect(() => {
        syncManagerRef.current = new AudioSyncManager()

        return () => {
            syncManagerRef.current?.destroy()
            syncManagerRef.current = null
        }
    }, [])

    // Monitor audio playback state
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)
        const handleEnded = () => setIsPlaying(false)

        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)
        audio.addEventListener('ended', handleEnded)

        // Initialize state
        setIsPlaying(!audio.paused)

        return () => {
            audio.removeEventListener('play', handlePlay)
            audio.removeEventListener('pause', handlePause)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

    // Monitor sync state
    useEffect(() => {
        const syncManager = syncManagerRef.current
        if (!syncManager) return

        const updateSyncState = () => {
            const state = syncManager.getSyncState()
            setIsSynced(state.isSynced)
            setDrift(state.drift)
            setLoopCount(state.loopCount)
        }

        // Update sync state periodically
        const intervalId = setInterval(updateSyncState, 100)

        return () => clearInterval(intervalId)
    }, [])

    /**
     * Sync audio with video element
     * Can be called multiple times to sync with different videos
     */
    const syncWithVideo = useCallback((videoRef: RefObject<HTMLVideoElement>) => {
        const audio = audioRef.current
        const video = videoRef.current
        const syncManager = syncManagerRef.current

        if (!audio || !video || !syncManager) {
            console.warn('[useAudioVideoSync] Missing audio, video, or sync manager')
            return
        }

        // Store video ref for potential re-sync
        videoRefCache.current = videoRef

        // Perform sync
        syncManager.syncAudioWithVideo(audio, video)

        // Set up loop callback to update state
        const loopCallback = (count: number) => {
            setLoopCount(count)
        }
        syncManager.handleVideoLoop(loopCallback)

        console.log('[useAudioVideoSync] Sync initiated')
    }, [])

    /**
     * Reset sync state
     * Useful when seeking or when sync needs to be reinitialized
     */
    const resetSync = useCallback(() => {
        const syncManager = syncManagerRef.current
        if (!syncManager) return

        syncManager.resetSync()

        // Re-sync if we have a cached video ref
        if (videoRefCache.current?.current && audioRef.current) {
            syncManager.syncAudioWithVideo(
                audioRef.current,
                videoRefCache.current.current
            )
        }

        console.log('[useAudioVideoSync] Sync reset')
    }, [])

    /**
     * Get full sync state object
     */
    const getSyncState = useCallback((): SyncState | null => {
        return syncManagerRef.current?.getSyncState() ?? null
    }, [])

    return {
        audioRef,
        syncWithVideo,
        isPlaying,
        isSynced,
        drift,
        loopCount,
        resetSync,
        getSyncState
    }
}
