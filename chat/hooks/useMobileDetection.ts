import { useState, useEffect } from 'react';

/**
 * Detect if user is on a mobile device
 */
export function useIsMobile(breakpoint: number = 768): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // Check on mount
        checkMobile();

        // Listen for resize
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [breakpoint]);

    return isMobile;
}

/**
 * Detect device type based on user agent and screen size
 */
export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

    useEffect(() => {
        const detectDevice = () => {
            const width = window.innerWidth;
            const userAgent = navigator.userAgent.toLowerCase();

            const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);

            if (width < 768 || (isMobileUA && width < 1024)) {
                setDeviceType('mobile');
            } else if (width < 1024 || isTabletUA) {
                setDeviceType('tablet');
            } else {
                setDeviceType('desktop');
            }
        };

        detectDevice();
        window.addEventListener('resize', detectDevice);
        return () => window.removeEventListener('resize', detectDevice);
    }, []);

    return deviceType;
}

/**
 * Check if device supports touch
 */
export function useIsTouchDevice(): boolean {
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        setIsTouch(
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            // @ts-ignore
            navigator.msMaxTouchPoints > 0
        );
    }, []);

    return isTouch;
}

/**
 * Check if running as PWA (standalone mode)
 */
export function useIsPWA(): boolean {
    const [isPWA, setIsPWA] = useState(false);

    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            // @ts-ignore
            window.navigator.standalone === true;

        setIsPWA(isStandalone);
    }, []);

    return isPWA;
}

/**
 * Get safe area insets for devices with notches
 */
export function useSafeAreaInsets() {
    const [insets, setInsets] = useState({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    });

    useEffect(() => {
        const updateInsets = () => {
            const style = getComputedStyle(document.documentElement);
            setInsets({
                top: parseInt(style.getPropertyValue('--sat') || '0'),
                right: parseInt(style.getPropertyValue('--sar') || '0'),
                bottom: parseInt(style.getPropertyValue('--sab') || '0'),
                left: parseInt(style.getPropertyValue('--sal') || '0')
            });
        };

        updateInsets();
        window.addEventListener('resize', updateInsets);
        return () => window.removeEventListener('resize', updateInsets);
    }, []);

    return insets;
}
