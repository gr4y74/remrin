import { useCallback } from "react"

export function useSFX() {
    const playSound = useCallback((path: string, volume = 0.5) => {
        try {
            const audio = new Audio(path)
            audio.volume = volume
            audio.play().catch(() => {
                // Ignore autoplay errors or missing files
            })
        } catch (e) {
            // Ignore audio context errors
        }
    }, [])

    const playClick = useCallback(() => {
        playSound("/sounds/click.mp3", 0.4)
    }, [playSound])

    const playHover = useCallback(() => {
        // Very subtle
        playSound("/sounds/hover.mp3", 0.1)
    }, [playSound])

    const playSuccess = useCallback(() => {
        playSound("/sounds/success.mp3", 0.6)
    }, [playSound])

    const playError = useCallback(() => {
        playSound("/sounds/error.mp3", 0.5)
    }, [playSound])

    return {
        playClick,
        playHover,
        playSuccess,
        playError
    }
}
