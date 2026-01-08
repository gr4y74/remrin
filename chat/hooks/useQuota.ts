'use client';

/**
 * useQuota Hook
 * 
 * React hook for accessing user's audio quota status.
 * Provides real-time quota data with automatic refresh.
 * 
 * @example
 * const { quota, loading, refresh, isLow, isExceeded } = useQuota();
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface QuotaData {
    tier: 'free' | 'premium' | 'vip';
    tierName: string;
    tierDescription: string;
    used: number;
    limit: number;
    remaining: number;
    percentUsed: number;
    unlimited: boolean;
    exceeded: boolean;
    inGracePeriod: boolean;
    graceRemaining: number;
    resetDate: string;
    resetIn: {
        hours: number;
        minutes: number;
        formatted: string;
    };
    providers: string[];
    canUpgrade: boolean;
    upgradeUrl: string | null;
    upgradeMessage: string | null;
}

export interface UseQuotaResult {
    /** Quota data */
    quota: QuotaData | null;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: string | null;
    /** Refresh quota data */
    refresh: () => Promise<void>;
    /** Whether quota is low (>80%) */
    isLow: boolean;
    /** Whether quota is exceeded */
    isExceeded: boolean;
    /** Whether user has unlimited quota */
    isUnlimited: boolean;
    /** Check if user can generate text of given length */
    canGenerate: (charCount: number) => boolean;
}

export interface UseQuotaOptions {
    /** Auto-refresh interval in ms (0 to disable) */
    refreshInterval?: number;
    /** Fetch on mount */
    fetchOnMount?: boolean;
    /** Callback when quota becomes low */
    onQuotaLow?: (percentUsed: number) => void;
    /** Callback when quota is exceeded */
    onQuotaExceeded?: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useQuota(options: UseQuotaOptions = {}): UseQuotaResult {
    const {
        refreshInterval = 60000, // 1 minute default
        fetchOnMount = true,
        onQuotaLow,
        onQuotaExceeded,
    } = options;

    const [quota, setQuota] = useState<QuotaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch quota data
    const fetchQuota = useCallback(async () => {
        try {
            const response = await fetch('/api/audio/quota');

            if (!response.ok) {
                if (response.status === 401) {
                    setQuota(null);
                    setError(null);
                    return;
                }
                throw new Error('Failed to fetch quota');
            }

            const data = await response.json();

            if (data.success && data.quota) {
                const newQuota = data.quota as QuotaData;
                setQuota(newQuota);
                setError(null);

                // Trigger callbacks
                if (newQuota.exceeded && onQuotaExceeded) {
                    onQuotaExceeded();
                } else if (newQuota.percentUsed >= 80 && onQuotaLow) {
                    onQuotaLow(newQuota.percentUsed);
                }
            }
        } catch (err) {
            console.error('[useQuota] Error:', err);
            setError('Failed to load quota');
        } finally {
            setLoading(false);
        }
    }, [onQuotaLow, onQuotaExceeded]);

    // Initial fetch
    useEffect(() => {
        if (fetchOnMount) {
            fetchQuota();
        }
    }, [fetchOnMount, fetchQuota]);

    // Auto-refresh
    useEffect(() => {
        if (refreshInterval <= 0) return;

        const interval = setInterval(fetchQuota, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval, fetchQuota]);

    // Computed values
    const isLow = quota ? quota.percentUsed >= 80 : false;
    const isExceeded = quota?.exceeded ?? false;
    const isUnlimited = quota?.unlimited ?? false;

    // Check if user can generate
    const canGenerate = useCallback((charCount: number): boolean => {
        if (!quota) return false;
        if (quota.unlimited) return true;
        return quota.remaining >= charCount;
    }, [quota]);

    return {
        quota,
        loading,
        error,
        refresh: fetchQuota,
        isLow,
        isExceeded,
        isUnlimited,
        canGenerate,
    };
}

export default useQuota;
