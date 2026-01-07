import { useState, useEffect, useCallback, useRef } from 'react'

interface UseAutoHideOptions {
    timeout?: number // milliseconds
    enabled?: boolean
}

export function useAutoHide({ timeout = 3000, enabled = true }: UseAutoHideOptions = {}) {
    const [isVisible, setIsVisible] = useState(true)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const showUI = useCallback(() => {
        setIsVisible(true)

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Set new timeout to hide UI
        if (enabled) {
            timeoutRef.current = setTimeout(() => {
                setIsVisible(false)
            }, timeout)
        }
    }, [timeout, enabled])

    useEffect(() => {
        if (!enabled) {
            setIsVisible(true)
            return
        }

        // Show UI initially
        showUI()

        // Event handlers
        const handleMouseMove = () => showUI()
        const handleTouchStart = () => showUI()
        const handleKeyDown = () => showUI()

        // Add event listeners
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('touchstart', handleTouchStart)
        window.addEventListener('keydown', handleKeyDown)

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('touchstart', handleTouchStart)
            window.removeEventListener('keydown', handleKeyDown)
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [showUI, enabled])

    return { isVisible, showUI }
}
