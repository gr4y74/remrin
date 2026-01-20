"use client"

import { useState, useEffect } from "react"

const ONBOARDING_KEY = "remrin_onboarding_complete"

export function useOnboarding() {
    // Start with true to avoid flash of modal on initial load before client-side check
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        try {
            const storedValue = window.localStorage.getItem(ONBOARDING_KEY)
            // If null, they haven't completed it. If "true", they have.
            setHasCompletedOnboarding(storedValue === "true")
        } catch (error) {
            console.error("Error reading from localStorage", error)
            // Default to true (don't show) in case of error to be less annoying
            setHasCompletedOnboarding(true)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const completeOnboarding = () => {
        try {
            window.localStorage.setItem(ONBOARDING_KEY, "true")
            setHasCompletedOnboarding(true)
        } catch (error) {
            console.error("Error writing to localStorage", error)
        }
    }

    const resetOnboarding = () => {
        try {
            window.localStorage.removeItem(ONBOARDING_KEY)
            setHasCompletedOnboarding(false)
        } catch (error) {
            console.error("Error removing from localStorage", error)
        }
    }

    return {
        hasCompletedOnboarding,
        isLoading,
        completeOnboarding,
        resetOnboarding
    }
}
