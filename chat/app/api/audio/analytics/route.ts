
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AudioCacheEntry, calculateCacheHitRate, estimateCost, AnalyticsSummary } from '@/lib/audio/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)
        const { searchParams } = new URL(request.url)

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Optional filters
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const personaId = searchParams.get('personaId')

        let query = supabase
            .from('audio_cache')
            .select('*')

        if (startDate) {
            query = query.gte('created_at', startDate)
        }
        if (endDate) {
            query = query.lte('created_at', endDate)
        }
        if (personaId) {
            query = query.eq('persona_id', personaId)
        }

        const { data: cacheEntries, error } = await query

        if (error) {
            console.error('Error fetching audio cache:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const entries = cacheEntries as AudioCacheEntry[]

        // --- Aggregation Logic ---

        let totalStorageBytes = 0
        let totalAccessCount = 0
        let estimatedTotalCost = 0
        const providerUsage: Record<string, number> = {}
        const voiceUsage: Record<string, { provider: string, count: number }> = {}
        const generationsByDate: Record<string, number> = {}

        entries.forEach(entry => {
            // Storage
            totalStorageBytes += entry.file_size_bytes || 0

            // Access Count (Hits = access_count, Misses = 1 (creation))
            // Assuming access_count tracks hits *after* creation.
            // Total Requests = access_count + 1 (for the initial generation)
            totalAccessCount += (entry.access_count || 0) + 1

            // Provider Usage
            const provider = entry.voice_provider || 'unknown'
            providerUsage[provider] = (providerUsage[provider] || 0) + 1

            // Voice Usage
            const voiceKey = `${entry.voice_provider}:${entry.voice_id}`
            if (!voiceUsage[voiceKey]) {
                voiceUsage[voiceKey] = { provider: entry.voice_provider, count: 0 }
            }
            voiceUsage[voiceKey].count += (entry.access_count || 0) + 1

            // Cost Estimation (Rough estimate as we don't store char count in cache, 
            // but we can approximate or if we stored it. 
            // Schema doesn't have char_count. We'll use a rough avg of 100 chars per generation for estimation if duration is missing, otherwise duration based?)
            // ElevenLabs is char based. We'll estimate 15 chars per second of audio.
            if (entry.duration_seconds) {
                const estimatedChars = entry.duration_seconds * 15
                estimatedTotalCost += estimateCost(provider, estimatedChars)
            }

            // Generations over time (based on creation)
            if (entry.created_at) {
                const date = new Date(entry.created_at).toISOString().split('T')[0]
                generationsByDate[date] = (generationsByDate[date] || 0) + 1
            }
        })

        const totalGenerations = entries.length
        const cacheHitRate = calculateCacheHitRate(totalAccessCount, totalGenerations)

        // Format Top Voices
        const topVoices = Object.entries(voiceUsage)
            .map(([key, val]) => ({
                voice_id: key.split(':')[1],
                provider: val.provider,
                count: val.count
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        // Format Generations Over Time
        const generationsOverTime = Object.entries(generationsByDate)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))

        const stats: AnalyticsSummary = {
            totalGenerations,
            totalRequests: totalAccessCount,
            cacheHitRate,
            totalStorageBytes,
            estimatedCost: estimatedTotalCost,
            providerUsage,
            topVoices,
            generationsOverTime
        }

        return NextResponse.json(stats)

    } catch (err) {
        console.error('Unexpected error in audio analytics:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
