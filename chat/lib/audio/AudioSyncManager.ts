/**
 * AudioSyncManager
 * 
 * Manages precise synchronization between audio and video elements.
 * Detects video loops and restarts audio accordingly, handles timing drift,
 * and provides graceful degradation when sync fails.
 * 
 * Key Features:
 * - Video loop detection via requestAnimationFrame
 * - Audio restart on video loop
 * - Timing drift correction (threshold: 50ms)
 * - Memory leak prevention with proper cleanup
 * - Error handling and graceful degradation
 * 
 * @example
 * const syncManager = new AudioSyncManager()
 * syncManager.syncAudioWithVideo(audioEl, videoEl)
 * // Later...
 * syncManager.destroy()
 */

export interface SyncState {
    isSynced: boolean
    drift: number
    lastVideoTime: number
    loopCount: number
}

export type LoopCallback = (loopCount: number) => void

export class AudioSyncManager {
    private audioElement: HTMLAudioElement | null = null
    private videoElement: HTMLVideoElement | null = null
    private rafId: number | null = null
    private lastVideoTime: number = 0
    private loopCount: number = 0
    private drift: number = 0
    private isSynced: boolean = false
    private loopCallbacks: Set<LoopCallback> = new Set()

    // Configuration
    private readonly DRIFT_THRESHOLD = 0.05 // 50ms
    private readonly LOOP_DETECTION_THRESHOLD = 0.5 // 500ms - video time jump backward

    /**
     * Synchronize audio playback with video element
     * Starts monitoring video for loop events and manages audio accordingly
     * 
     * @param audioElement - The audio element to synchronize
     * @param videoElement - The video element to sync with
     */
    syncAudioWithVideo(
        audioElement: HTMLAudioElement,
        videoElement: HTMLVideoElement
    ): void {
        // Clean up any existing sync
        this.resetSync()

        this.audioElement = audioElement
        this.videoElement = videoElement

        // Validate elements
        if (!audioElement || !videoElement) {
            console.warn('[AudioSyncManager] Invalid elements provided')
            return
        }

        // Initialize sync state
        this.lastVideoTime = videoElement.currentTime
        this.isSynced = true

        // Set up event listeners for sync
        this.setupEventListeners()

        // Start monitoring loop
        this.startMonitoring()

        console.log('[AudioSyncManager] Sync initialized')
    }

    /**
     * Register a callback to be called when video loops
     * 
     * @param callback - Function to call on video loop (receives loop count)
     */
    handleVideoLoop(callback: LoopCallback): void {
        this.loopCallbacks.add(callback)
    }

    /**
     * Remove a loop callback
     * 
     * @param callback - The callback to remove
     */
    removeLoopCallback(callback: LoopCallback): void {
        this.loopCallbacks.delete(callback)
    }

    /**
     * Reset sync state without destroying the manager
     * Useful when seeking or reinitializing sync
     */
    resetSync(): void {
        this.stopMonitoring()
        this.removeEventListeners()
        this.lastVideoTime = this.videoElement?.currentTime ?? 0
        this.drift = 0
        this.loopCount = 0
        this.isSynced = false

        console.log('[AudioSyncManager] Sync reset')
    }

    /**
     * Get current sync state
     */
    getSyncState(): SyncState {
        return {
            isSynced: this.isSynced,
            drift: this.drift,
            lastVideoTime: this.lastVideoTime,
            loopCount: this.loopCount
        }
    }

    /**
     * Destroy the sync manager and clean up all resources
     * Must be called on unmount to prevent memory leaks
     */
    destroy(): void {
        this.resetSync()
        this.loopCallbacks.clear()
        this.audioElement = null
        this.videoElement = null

        console.log('[AudioSyncManager] Destroyed')
    }

    // Private methods

    private setupEventListeners(): void {
        if (!this.videoElement || !this.audioElement) return

        // Sync audio state with video state
        this.videoElement.addEventListener('play', this.handleVideoPlay)
        this.videoElement.addEventListener('pause', this.handleVideoPause)
        this.videoElement.addEventListener('seeking', this.handleVideoSeeking)
        this.videoElement.addEventListener('waiting', this.handleVideoWaiting)
        this.videoElement.addEventListener('playing', this.handleVideoPlaying)
    }

    private removeEventListeners(): void {
        if (!this.videoElement) return

        this.videoElement.removeEventListener('play', this.handleVideoPlay)
        this.videoElement.removeEventListener('pause', this.handleVideoPause)
        this.videoElement.removeEventListener('seeking', this.handleVideoSeeking)
        this.videoElement.removeEventListener('waiting', this.handleVideoWaiting)
        this.videoElement.removeEventListener('playing', this.handleVideoPlaying)
    }

    private handleVideoPlay = (): void => {
        if (!this.audioElement) return

        this.audioElement.play().catch((err) => {
            console.error('[AudioSyncManager] Failed to play audio:', err)
        })
    }

    private handleVideoPause = (): void => {
        if (!this.audioElement) return

        this.audioElement.pause()
    }

    private handleVideoSeeking = (): void => {
        // When user seeks video, restart audio from beginning
        if (!this.audioElement) return

        this.audioElement.currentTime = 0
        this.lastVideoTime = this.videoElement?.currentTime ?? 0
        this.drift = 0

        console.log('[AudioSyncManager] Video seeking - audio reset')
    }

    private handleVideoWaiting = (): void => {
        // Video is buffering, pause audio to stay in sync
        if (!this.audioElement) return

        this.audioElement.pause()
    }

    private handleVideoPlaying = (): void => {
        // Video resumed from buffering, resume audio
        if (!this.audioElement || !this.videoElement) return

        if (!this.videoElement.paused) {
            this.audioElement.play().catch((err) => {
                console.error('[AudioSyncManager] Failed to resume audio:', err)
            })
        }
    }

    private startMonitoring(): void {
        if (this.rafId !== null) return

        const monitor = (): void => {
            if (!this.videoElement || !this.audioElement) {
                this.stopMonitoring()
                return
            }

            const currentVideoTime = this.videoElement.currentTime

            // Detect video loop: current time < last time (jumped backward)
            const timeDiff = currentVideoTime - this.lastVideoTime
            if (timeDiff < -this.LOOP_DETECTION_THRESHOLD) {
                this.onVideoLoop()
            }

            // Check for drift and correct if needed
            if (this.isSynced && !this.videoElement.paused && !this.audioElement.paused) {
                this.checkAndCorrectDrift()
            }

            this.lastVideoTime = currentVideoTime
            this.rafId = requestAnimationFrame(monitor)
        }

        this.rafId = requestAnimationFrame(monitor)
    }

    private stopMonitoring(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
    }

    private onVideoLoop(): void {
        if (!this.audioElement) return

        this.loopCount++

        // Restart audio from beginning
        this.audioElement.currentTime = 0

        // If audio is paused but video is playing, play it
        if (this.videoElement && !this.videoElement.paused && this.audioElement.paused) {
            this.audioElement.play().catch((err) => {
                console.error('[AudioSyncManager] Failed to restart audio on loop:', err)
            })
        }

        // Reset drift
        this.drift = 0

        // Notify callbacks
        this.loopCallbacks.forEach(callback => {
            try {
                callback(this.loopCount)
            } catch (err) {
                console.error('[AudioSyncManager] Loop callback error:', err)
            }
        })

        console.log(`[AudioSyncManager] Video loop detected (count: ${this.loopCount})`)
    }

    private checkAndCorrectDrift(): void {
        if (!this.audioElement || !this.videoElement) return

        // Calculate drift: difference between video and audio time
        const videoDuration = this.videoElement.duration
        const audioDuration = this.audioElement.duration

        if (!isFinite(videoDuration) || !isFinite(audioDuration)) return

        // Normalize times to handle different durations
        const videoProgress = this.videoElement.currentTime / videoDuration
        const audioProgress = this.audioElement.currentTime / audioDuration

        this.drift = Math.abs(videoProgress - audioProgress) * Math.min(videoDuration, audioDuration)

        // If drift exceeds threshold, correct it
        if (this.drift > this.DRIFT_THRESHOLD) {
            // Sync audio to video position
            const targetAudioTime = videoProgress * audioDuration

            // Only adjust if the difference is significant and safe
            if (targetAudioTime >= 0 && targetAudioTime <= audioDuration) {
                this.audioElement.currentTime = targetAudioTime

                console.log(`[AudioSyncManager] Drift corrected: ${(this.drift * 1000).toFixed(0)}ms`)
                this.drift = 0
            }
        }
    }
}

/**
 * Create a new AudioSyncManager instance
 * Convenience factory function
 */
export function createAudioSyncManager(): AudioSyncManager {
    return new AudioSyncManager()
}
