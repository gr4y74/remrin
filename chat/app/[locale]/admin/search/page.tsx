'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminPasswordGate } from '@/components/admin/AdminPasswordGate'
import SearchProviderCard from '@/components/admin/SearchProviderCard'
import SearchStatsPanel from '@/components/admin/SearchStatsPanel'

interface SearchProvider {
    id: string
    provider_name: string
    api_key_encrypted: string | null
    enabled: boolean
    priority: number
    rate_limit: number
    max_results: number
    search_depth: string
    success_count: number
    failure_count: number
    total_response_time_ms: number
    last_success_at: string | null
    last_failure_at: string | null
}

export default function AdminSearchPage() {
    const [providers, setProviders] = useState<SearchProvider[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'providers' | 'stats'>('providers')

    const fetchProviders = async () => {
        try {
            const adminPassword = sessionStorage.getItem('admin_password')
            const response = await fetch('/api/admin/search-config', {
                headers: {
                    'x-admin-password': adminPassword || ''
                }
            })

            if (!response.ok) throw new Error('Failed to fetch providers')

            const data = await response.json()
            setProviders(data.providers || [])
        } catch (error) {
            toast.error('Failed to load search providers')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchProviders()
    }, [])

    return (
        <AdminPasswordGate>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-8">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-2xl">
                                🔍
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">
                                    Search Provider Management
                                </h1>
                                <p className="text-white/60">
                                    Configure and monitor web search integrations
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mb-6 flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
                        <button
                            onClick={() => setActiveTab('providers')}
                            className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all ${activeTab === 'providers'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                                : 'text-white/60 hover:text-white'
                                }`}
                        >
                            🔧 Providers
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all ${activeTab === 'stats'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                                : 'text-white/60 hover:text-white'
                                }`}
                        >
                            📊 Statistics
                        </button>
                    </div>

                    {/* Content */}
                    {activeTab === 'providers' ? (
                        <div className="space-y-6">
                            {/* Info Banner */}
                            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">💡</div>
                                    <div>
                                        <h3 className="mb-1 font-semibold text-blue-400">
                                            Search Provider Configuration
                                        </h3>
                                        <p className="text-sm text-white/60">
                                            Configure multiple search providers with automatic
                                            failover. Providers are tried in priority order. Enable
                                            at least one provider for web search functionality.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Fallback Chain Visualization */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                                <h3 className="mb-4 text-lg font-semibold text-white">
                                    🔗 Fallback Chain
                                </h3>
                                <div className="flex flex-wrap items-center gap-3">
                                    {providers
                                        .filter((p) => p.enabled)
                                        .sort((a, b) => a.priority - b.priority)
                                        .map((provider, index, arr) => (
                                            <div key={provider.id} className="flex items-center gap-3">
                                                <div className="rounded-lg border border-white/20 bg-gradient-to-br from-white/10 to-white/5 px-4 py-2">
                                                    <div className="text-xs text-white/60">
                                                        Priority {provider.priority}
                                                    </div>
                                                    <div className="font-medium capitalize text-white">
                                                        {provider.provider_name}
                                                    </div>
                                                </div>
                                                {index < arr.length - 1 && (
                                                    <div className="text-white/40">→</div>
                                                )}
                                            </div>
                                        ))}
                                    {providers.filter((p) => p.enabled).length === 0 && (
                                        <div className="text-white/40">
                                            No providers enabled. Enable at least one provider to use
                                            web search.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Provider Cards */}
                            {isLoading ? (
                                <div className="flex h-64 items-center justify-center">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    {providers.map((provider) => (
                                        <SearchProviderCard
                                            key={provider.id}
                                            provider={provider}
                                            onUpdate={fetchProviders}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Documentation Section */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                                <h3 className="mb-4 text-lg font-semibold text-white">
                                    📚 Setup Guides
                                </h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                        <h4 className="mb-2 font-medium text-white">
                                            Tavily Search
                                        </h4>
                                        <p className="mb-3 text-sm text-white/60">
                                            AI-optimized search API with built-in answer generation.
                                            Best for RAG applications.
                                        </p>
                                        <a
                                            href="https://tavily.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-400 hover:underline"
                                        >
                                            Get API Key ←
                                        </a>
                                    </div>

                                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                        <h4 className="mb-2 font-medium text-white">
                                            Google Custom Search
                                        </h4>
                                        <p className="mb-3 text-sm text-white/60">
                                            Powered by Google&apos;s search engine. Requires Custom
                                            Search Engine ID and API key.
                                        </p>
                                        <a
                                            href="https://developers.google.com/custom-search"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-400 hover:underline"
                                        >
                                            Setup Guide →
                                        </a>
                                    </div>

                                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                        <h4 className="mb-2 font-medium text-white">
                                            DuckDuckGo Search
                                        </h4>
                                        <p className="mb-3 text-sm text-white/60">
                                            Privacy-focused search. No API key required for basic
                                            usage.
                                        </p>
                                        <a
                                            href="https://duckduckgo.com/api"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-400 hover:underline"
                                        >
                                            Documentation →
                                        </a>
                                    </div>

                                    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                                        <h4 className="mb-2 font-medium text-white">
                                            Brave Search
                                        </h4>
                                        <p className="mb-3 text-sm text-white/60">
                                            Independent search index with privacy focus. API key
                                            required.
                                        </p>
                                        <a
                                            href="https://brave.com/search/api/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-400 hover:underline"
                                        >
                                            Get API Key →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <SearchStatsPanel />
                    )}
                </div>
            </div>
        </AdminPasswordGate>
    )
}
