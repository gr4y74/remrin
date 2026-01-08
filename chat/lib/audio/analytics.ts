
import { Database } from '@/supabase/types'

export type AudioCacheEntry = Database['public']['Tables']['audio_cache']['Row']

export const PROVIDER_COSTS = {
    edge: 0, // Free
    kokoro: 0, // Self-hosted/Free for now
    elevenlabs: 0.00018 // ~$0.18 per 1k characters
}

export interface AnalyticsSummary {
    totalGenerations: number
    totalRequests: number
    cacheHitRate: number
    totalStorageBytes: number
    estimatedCost: number
    providerUsage: Record<string, number>
    topVoices: Array<{
        voice_id: string
        provider: string
        count: number
    }>
    generationsOverTime: Array<{
        date: string
        count: number
    }>
}

export function calculateCacheHitRate(totalRequests: number, uniqueGenerations: number): number {
    if (totalRequests === 0) return 0
    return ((totalRequests - uniqueGenerations) / totalRequests) * 100
}

export function estimateCost(provider: string, charCount: number): number {
    const costPerChar = PROVIDER_COSTS[provider as keyof typeof PROVIDER_COSTS] || 0
    return charCount * costPerChar
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
