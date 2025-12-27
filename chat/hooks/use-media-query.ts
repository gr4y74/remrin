import { useMediaQuery as useResponsiveMediaQuery } from 'react-responsive'

export function useMediaQuery() {
    const isMobile = useResponsiveMediaQuery({ maxWidth: 767 })
    const isTablet = useResponsiveMediaQuery({ minWidth: 768, maxWidth: 1023 })
    const isDesktop = useResponsiveMediaQuery({ minWidth: 1024 })
    const isWide = useResponsiveMediaQuery({ minWidth: 1440 })

    return {
        isMobile,
        isTablet,
        isDesktop,
        isWide,
        // Convenience flags
        isMobileOrTablet: isMobile || isTablet,
        isDesktopOrWide: isDesktop || isWide,
    }
}
