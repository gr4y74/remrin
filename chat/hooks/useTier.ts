'use client'

import { useState, useEffect } from 'react'

export function useTier(userId?: string) {
    const [tier, setTier] = useState<string>('wanderer')
    const [tierName, setTierName] = useState<string>('Wanderer')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        // In a real app, fetch from API
        // For now, we'll use a placeholder
        setTier('wanderer')
        setTierName('Wanderer')
        setLoading(false)
    }, [userId])

    return { tier, tierName, loading }
}

export function useFeature(userId: string | undefined, featureKey: string) {
    const [enabled, setEnabled] = useState(false)
    const [limit, setLimit] = useState<number | undefined>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) {
            setLoading(false)
            return
        }

        async function checkFeature() {
            try {
                const res = await fetch(`/api/user/features?feature=${featureKey}`)
                const data = await res.json()
                setEnabled(data.enabled || false)
                setLimit(data.limit)
            } catch (error) {
                console.error('Failed to check feature:', error)
            } finally {
                setLoading(false)
            }
        }

        checkFeature()
    }, [userId, featureKey])

    return { enabled, limit, loading }
}
