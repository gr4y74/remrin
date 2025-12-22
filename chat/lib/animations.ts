/**
 * Animation Utilities for UI Polish
 * 
 * GPU-accelerated animations using transform and opacity only.
 * All timing follows: 200-400ms for micro-interactions.
 */

// Stagger delay calculation for child elements
export function staggerDelay(index: number, baseDelay = 50): number {
    return index * baseDelay
}

// Get inline style for staggered animation
export function getStaggerStyle(index: number, baseDelay = 50): React.CSSProperties {
    return {
        animationDelay: `${staggerDelay(index, baseDelay)}ms`,
        animationFillMode: 'both'
    }
}

// 3D Tilt effect calculation for hover
export function calculateTilt(
    e: React.MouseEvent<HTMLElement>,
    maxTilt = 10
): { rotateX: number; rotateY: number } {
    const element = e.currentTarget
    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY

    // Normalize and calculate rotation
    const rotateY = (mouseX / (rect.width / 2)) * maxTilt
    const rotateX = -(mouseY / (rect.height / 2)) * maxTilt

    return { rotateX, rotateY }
}

// Hook for parallax scroll effect
import { useState, useEffect, useCallback } from 'react'

export function useParallaxScroll(factor = 0.5): number {
    const [offset, setOffset] = useState(0)

    const handleScroll = useCallback(() => {
        // Check for reduced motion preference
        if (typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return
        }
        setOffset(window.scrollY * factor)
    }, [factor])

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [handleScroll])

    return offset
}

// Check if reduced motion is preferred
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Animation duration constants
export const ANIMATION_DURATION = {
    fast: 150,
    normal: 300,
    slow: 500
} as const

// Easing functions as CSS values
export const EASING = {
    entrance: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
} as const
