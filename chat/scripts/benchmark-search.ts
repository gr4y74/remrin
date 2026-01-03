/**
 * Search Performance Benchmark
 * 
 * Measures response times and reliability of search providers
 */

import { searchManager } from '@/lib/chat-engine/capabilities/search'

interface BenchmarkResult {
    provider: string
    query: string
    responseTime: number
    resultCount: number
    success: boolean
    error?: string
}

const TEST_QUERIES = [
    'latest AI news',
    'TypeScript best practices',
    'climate change 2026',
    'quantum computing breakthrough',
    'web development trends'
]

async function benchmarkProvider(
    providerId: string,
    query: string
): Promise<BenchmarkResult> {
    const startTime = Date.now()

    try {
        const response = await searchManager.searchWithProvider(
            query,
            providerId as any,
            5
        )

        const responseTime = Date.now() - startTime

        return {
            provider: providerId,
            query,
            responseTime,
            resultCount: response.results.length,
            success: true
        }
    } catch (error) {
        const responseTime = Date.now() - startTime

        return {
            provider: providerId,
            query,
            responseTime,
            resultCount: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

async function runBenchmark() {
    console.log('🔍 Search Provider Performance Benchmark\n')
    console.log('='.repeat(80))

    const providers = ['tavily', 'google', 'brave', 'duckduckgo']
    const results: BenchmarkResult[] = []

    for (const provider of providers) {
        console.log(`\n📊 Testing ${provider.toUpperCase()}...`)

        for (const query of TEST_QUERIES) {
            console.log(`  Query: "${query}"`)
            const result = await benchmarkProvider(provider, query)
            results.push(result)

            if (result.success) {
                console.log(`  ✅ ${result.responseTime}ms - ${result.resultCount} results`)
            } else {
                console.log(`  ❌ ${result.responseTime}ms - ${result.error}`)
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500))
        }
    }

    // Calculate statistics
    console.log('\n' + '='.repeat(80))
    console.log('\n📈 BENCHMARK RESULTS\n')

    for (const provider of providers) {
        const providerResults = results.filter(r => r.provider === provider)
        const successfulResults = providerResults.filter(r => r.success)

        if (successfulResults.length === 0) {
            console.log(`${provider.toUpperCase()}: ❌ All requests failed`)
            continue
        }

        const responseTimes = successfulResults.map(r => r.responseTime)
        const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        const minTime = Math.min(...responseTimes)
        const maxTime = Math.max(...responseTimes)
        const successRate = (successfulResults.length / providerResults.length) * 100

        // Calculate P95
        const sorted = [...responseTimes].sort((a, b) => a - b)
        const p95Index = Math.floor(sorted.length * 0.95)
        const p95 = sorted[p95Index]

        console.log(`${provider.toUpperCase()}:`)
        console.log(`  Success Rate: ${successRate.toFixed(1)}%`)
        console.log(`  Avg Response: ${avgTime.toFixed(0)}ms`)
        console.log(`  Min Response: ${minTime}ms`)
        console.log(`  Max Response: ${maxTime}ms`)
        console.log(`  P95 Response: ${p95}ms`)
        console.log(`  Avg Results: ${(successfulResults.reduce((a, b) => a + b.resultCount, 0) / successfulResults.length).toFixed(1)}`)
        console.log()
    }

    // Provider status
    console.log('='.repeat(80))
    console.log('\n🔧 PROVIDER STATUS\n')
    const status = searchManager.getProviderStatus()

    for (const [id, state] of Object.entries(status)) {
        const emoji = state.available ? '✅' : '❌'
        console.log(`${emoji} ${id.toUpperCase()}:`)
        console.log(`   Configured: ${state.configured}`)
        console.log(`   Circuit: ${state.circuitState}`)
        console.log(`   Available: ${state.available}`)
        console.log()
    }

    console.log('='.repeat(80))
    console.log('\n✅ Benchmark complete!\n')
}

// Run if executed directly
if (require.main === module) {
    runBenchmark().catch(console.error)
}

export { runBenchmark, benchmarkProvider }
