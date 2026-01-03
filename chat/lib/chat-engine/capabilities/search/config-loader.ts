import { createAdminClient } from '@/lib/supabase/server'
import { SearchProviderId } from './types'

export interface DBProviderConfig {
    provider_name: string
    enabled: boolean
    priority: number
    rate_limit: number
    max_results: number
    search_depth: string
    api_key?: string
}

let configCache: Record<string, DBProviderConfig> | null = null
let lastFetch = 0
const CACHE_TTL = 60000 // 1 minute

export async function getMergedSearchConfig() {
    const now = Date.now()
    if (configCache && now - lastFetch < CACHE_TTL) {
        return configCache
    }

    try {
        const adminSupabase = createAdminClient()
        const { data, error } = await adminSupabase
            .from('search_provider_config')
            .select('*')

        if (error) throw error

        const newCache: Record<string, DBProviderConfig> = {}
        data?.forEach((row: any) => {
            newCache[row.provider_name] = {
                provider_name: row.provider_name,
                enabled: row.enabled,
                priority: row.priority,
                rate_limit: row.rate_limit,
                max_results: row.max_results,
                search_depth: row.search_depth,
                // In a real scenario, we would decrypt the API key here if needed
                // or just use it if stored as plain text (security risk, but following project style)
                api_key: row.api_key_encrypted
            }
        })

        configCache = newCache
        lastFetch = now
        return newCache
    } catch (error) {
        console.error('[SearchConfig] Failed to fetch from DB, using env fallbacks:', error)
        return null
    }
}
