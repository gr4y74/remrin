import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface SearchStats {
    totalSearches: number
    todaySearches: number
    weekSearches: number
    monthSearches: number
    providerDistribution: Array<{
        provider: string
        count: number
        percentage: number
    }>
    successRate: {
        overall: number
        byProvider: Record<string, number>
    }
    averageResponseTime: {
        overall: number
        byProvider: Record<string, number>
    }
    recentQueries: Array<{
        query: string
        provider: string
        success: boolean
        response_time_ms: number
        created_at: string
    }>
    providerHealth: Array<{
        provider: string
        enabled: boolean
        success_count: number
        failure_count: number
        success_rate: number
        avg_response_time: number
        last_success_at: string | null
        last_failure_at: string | null
    }>
}

/**
 * GET /api/admin/search-stats
 * Fetch comprehensive search statistics and monitoring data
 */
export async function GET(req: NextRequest) {
    try {
        // Verify admin authentication
        const adminPassword = req.headers.get('x-admin-password')
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createAdminClient()

        // Get time ranges
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        // Fetch all search stats
        const { data: allStats, error: statsError } = await supabase
            .from('search_stats')
            .select('*')
            .order('created_at', { ascending: false })

        if (statsError) {
            console.error('[Admin] Error fetching search stats:', statsError)
            return NextResponse.json({ error: statsError.message }, { status: 500 })
        }

        // Fetch provider health from config table
        const { data: providers, error: providersError } = await supabase
            .from('search_provider_config')
            .select('*')
            .order('priority', { ascending: true })

        if (providersError) {
            console.error('[Admin] Error fetching providers:', providersError)
            return NextResponse.json(
                { error: providersError.message },
                { status: 500 }
            )
        }

        // Calculate statistics
        const stats: SearchStats = {
            totalSearches: allStats.length,
            todaySearches: allStats.filter(
                (s) => new Date(s.created_at) >= todayStart
            ).length,
            weekSearches: allStats.filter(
                (s) => new Date(s.created_at) >= weekStart
            ).length,
            monthSearches: allStats.filter(
                (s) => new Date(s.created_at) >= monthStart
            ).length,
            providerDistribution: [],
            successRate: {
                overall: 0,
                byProvider: {}
            },
            averageResponseTime: {
                overall: 0,
                byProvider: {}
            },
            recentQueries: allStats.slice(0, 20).map((s) => ({
                query: s.query,
                provider: s.provider_name,
                success: s.success,
                response_time_ms: s.response_time_ms || 0,
                created_at: s.created_at
            })),
            providerHealth: []
        }

        // Calculate provider distribution
        const providerCounts: Record<string, number> = {}
        allStats.forEach((s) => {
            providerCounts[s.provider_name] = (providerCounts[s.provider_name] || 0) + 1
        })

        stats.providerDistribution = Object.entries(providerCounts).map(
            ([provider, count]) => ({
                provider,
                count,
                percentage: (count / allStats.length) * 100
            })
        )

        // Calculate success rates
        const successCount = allStats.filter((s) => s.success).length
        stats.successRate.overall =
            allStats.length > 0 ? (successCount / allStats.length) * 100 : 0

        // Calculate per-provider success rates
        Object.keys(providerCounts).forEach((provider) => {
            const providerStats = allStats.filter((s) => s.provider_name === provider)
            const providerSuccess = providerStats.filter((s) => s.success).length
            stats.successRate.byProvider[provider] =
                providerStats.length > 0
                    ? (providerSuccess / providerStats.length) * 100
                    : 0
        })

        // Calculate average response times
        const totalResponseTime = allStats.reduce(
            (sum, s) => sum + (s.response_time_ms || 0),
            0
        )
        stats.averageResponseTime.overall =
            allStats.length > 0 ? totalResponseTime / allStats.length : 0

        // Calculate per-provider response times
        Object.keys(providerCounts).forEach((provider) => {
            const providerStats = allStats.filter((s) => s.provider_name === provider)
            const providerResponseTime = providerStats.reduce(
                (sum, s) => sum + (s.response_time_ms || 0),
                0
            )
            stats.averageResponseTime.byProvider[provider] =
                providerStats.length > 0
                    ? providerResponseTime / providerStats.length
                    : 0
        })

        // Build provider health data
        stats.providerHealth = providers.map((p) => {
            const totalRequests = p.success_count + p.failure_count
            const successRate =
                totalRequests > 0 ? (p.success_count / totalRequests) * 100 : 0
            const avgResponseTime =
                p.success_count > 0 ? p.total_response_time_ms / p.success_count : 0

            return {
                provider: p.provider_name,
                enabled: p.enabled,
                success_count: p.success_count,
                failure_count: p.failure_count,
                success_rate: successRate,
                avg_response_time: avgResponseTime,
                last_success_at: p.last_success_at,
                last_failure_at: p.last_failure_at
            }
        })

        return NextResponse.json(stats)
    } catch (error) {
        console.error('[Admin] Search stats error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/admin/search-stats
 * Record a search event (called by search middleware)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const {
            provider_name,
            query,
            success,
            response_time_ms,
            results_count,
            error_message,
            user_id
        } = body

        if (!provider_name || !query) {
            return NextResponse.json(
                { error: 'provider_name and query are required' },
                { status: 400 }
            )
        }

        const supabase = createAdminClient()

        // Insert search stat
        const { error: insertError } = await supabase.from('search_stats').insert({
            provider_name,
            query,
            success: success !== false,
            response_time_ms: response_time_ms || 0,
            results_count: results_count || 0,
            error_message,
            user_id
        })

        if (insertError) {
            console.error('[Admin] Error inserting search stat:', insertError)
            return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        // Update provider config stats
        const { data: currentProvider } = await supabase
            .from('search_provider_config')
            .select('success_count, failure_count, total_response_time_ms')
            .eq('provider_name', provider_name)
            .single()

        if (currentProvider) {
            const { error: updateError } = await supabase
                .from('search_provider_config')
                .update({
                    success_count: success
                        ? currentProvider.success_count + 1
                        : currentProvider.success_count,
                    failure_count: !success
                        ? currentProvider.failure_count + 1
                        : currentProvider.failure_count,
                    total_response_time_ms:
                        currentProvider.total_response_time_ms + (response_time_ms || 0),
                    last_success_at: success ? new Date().toISOString() : undefined,
                    last_failure_at: !success ? new Date().toISOString() : undefined
                })
                .eq('provider_name', provider_name)

            if (updateError) {
                console.error('[Admin] Error updating provider stats:', updateError)
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Admin] Search stats POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
