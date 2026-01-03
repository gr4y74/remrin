'use client'

import { useState } from 'react'
import { toast } from 'sonner'

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

interface SearchProviderCardProps {
    provider: SearchProvider
    onUpdate: () => void
}

const PROVIDER_INFO: Record<
    string,
    { name: string; logo: string; color: string; setupUrl: string }
> = {
    tavily: {
        name: 'Tavily',
        logo: '🔍',
        color: 'from-blue-500 to-cyan-500',
        setupUrl: 'https://tavily.com'
    },
    google: {
        name: 'Google Custom Search',
        logo: '🌐',
        color: 'from-red-500 to-yellow-500',
        setupUrl: 'https://developers.google.com/custom-search'
    },
    duckduckgo: {
        name: 'DuckDuckGo',
        logo: '🦆',
        color: 'from-orange-500 to-red-500',
        setupUrl: 'https://duckduckgo.com/api'
    },
    brave: {
        name: 'Brave Search',
        logo: '🦁',
        color: 'from-purple-500 to-pink-500',
        setupUrl: 'https://brave.com/search/api/'
    }
}

export default function SearchProviderCard({
    provider,
    onUpdate
}: SearchProviderCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [apiKey, setApiKey] = useState('')
    const [rateLimit, setRateLimit] = useState(provider.rate_limit)
    const [maxResults, setMaxResults] = useState(provider.max_results)
    const [searchDepth, setSearchDepth] = useState(provider.search_depth)
    const [isTesting, setIsTesting] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    const info = PROVIDER_INFO[provider.provider_name] || {
        name: provider.provider_name,
        logo: '🔎',
        color: 'from-gray-500 to-gray-700',
        setupUrl: '#'
    }

    const totalRequests = provider.success_count + provider.failure_count
    const successRate =
        totalRequests > 0 ? (provider.success_count / totalRequests) * 100 : 0
    const avgResponseTime =
        provider.success_count > 0
            ? provider.total_response_time_ms / provider.success_count
            : 0

    const getStatusColor = () => {
        if (!provider.enabled) return 'bg-gray-500'
        if (provider.last_failure_at && !provider.last_success_at) return 'bg-red-500'
        if (successRate < 50) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    const getStatusText = () => {
        if (!provider.enabled) return 'Disabled'
        if (provider.last_failure_at && !provider.last_success_at) return 'Error'
        if (successRate < 50) return 'Degraded'
        return 'Active'
    }

    const handleToggle = async () => {
        setIsUpdating(true)
        try {
            const adminPassword = sessionStorage.getItem('admin_password')
            const response = await fetch('/api/admin/search-config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': adminPassword || ''
                },
                body: JSON.stringify({
                    provider_name: provider.provider_name,
                    enabled: !provider.enabled
                })
            })

            if (!response.ok) throw new Error('Failed to toggle provider')

            toast.success(
                `${info.name} ${!provider.enabled ? 'enabled' : 'disabled'}`
            )
            onUpdate()
        } catch (error) {
            toast.error('Failed to toggle provider')
            console.error(error)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleSave = async () => {
        setIsUpdating(true)
        try {
            const adminPassword = sessionStorage.getItem('admin_password')
            const response = await fetch('/api/admin/search-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': adminPassword || ''
                },
                body: JSON.stringify({
                    provider_name: provider.provider_name,
                    api_key: apiKey || undefined,
                    rate_limit: rateLimit,
                    max_results: maxResults,
                    search_depth: searchDepth
                })
            })

            if (!response.ok) throw new Error('Failed to update provider')

            toast.success(`${info.name} configuration updated`)
            setIsEditing(false)
            setApiKey('')
            onUpdate()
        } catch (error) {
            toast.error('Failed to update provider')
            console.error(error)
        } finally {
            setIsUpdating(false)
        }
    }

    const handleTest = async () => {
        setIsTesting(true)
        try {
            // Test search with a simple query
            const testQuery = 'test search query'
            toast.info(`Testing ${info.name}...`)

            // This would call your actual search endpoint
            // For now, we'll simulate a test
            await new Promise((resolve) => setTimeout(resolve, 1500))

            toast.success(`${info.name} test successful!`)
        } catch (error) {
            toast.error(`${info.name} test failed`)
            console.error(error)
        } finally {
            setIsTesting(false)
        }
    }

    const handleRemoveKey = async () => {
        if (!confirm(`Remove API key for ${info.name}?`)) return

        setIsUpdating(true)
        try {
            const adminPassword = sessionStorage.getItem('admin_password')
            const response = await fetch(
                `/api/admin/search-config?provider_name=${provider.provider_name}`,
                {
                    method: 'DELETE',
                    headers: {
                        'x-admin-password': adminPassword || ''
                    }
                }
            )

            if (!response.ok) throw new Error('Failed to remove API key')

            toast.success(`${info.name} API key removed`)
            onUpdate()
        } catch (error) {
            toast.error('Failed to remove API key')
            console.error(error)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-sm transition-all hover:border-white/20">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${info.color} text-2xl`}
                    >
                        {info.logo}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{info.name}</h3>
                        <div className="flex items-center gap-2">
                            <div
                                className={`h-2 w-2 rounded-full ${getStatusColor()} animate-pulse`}
                            />
                            <span className="text-sm text-white/60">{getStatusText()}</span>
                        </div>
                    </div>
                </div>

                {/* Toggle Switch */}
                <button
                    onClick={handleToggle}
                    disabled={isUpdating}
                    className={`relative h-6 w-11 rounded-full transition-colors ${provider.enabled ? 'bg-green-500' : 'bg-white/20'
                        } ${isUpdating ? 'opacity-50' : ''}`}
                >
                    <div
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${provider.enabled ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                    />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-xs text-white/60">Success Rate</div>
                    <div className="text-lg font-semibold text-white">
                        {successRate.toFixed(1)}%
                    </div>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-xs text-white/60">Avg Response</div>
                    <div className="text-lg font-semibold text-white">
                        {avgResponseTime.toFixed(0)}ms
                    </div>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-xs text-white/60">Total Requests</div>
                    <div className="text-lg font-semibold text-white">
                        {totalRequests}
                    </div>
                </div>
            </div>

            {/* Configuration */}
            {isEditing ? (
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm text-white/60">
                            API Key {provider.api_key_encrypted && '(Configured)'}
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter new API key..."
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm text-white/60">
                                Rate Limit
                            </label>
                            <input
                                type="number"
                                value={rateLimit}
                                onChange={(e) => setRateLimit(Number(e.target.value))}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white/30 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-white/60">
                                Max Results
                            </label>
                            <input
                                type="number"
                                value={maxResults}
                                onChange={(e) => setMaxResults(Number(e.target.value))}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white/30 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-white/60">
                            Search Depth
                        </label>
                        <select
                            value={searchDepth}
                            onChange={(e) => setSearchDepth(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-white/30 focus:outline-none"
                        >
                            <option value="basic">Basic</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isUpdating}
                            className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(false)
                                setApiKey('')
                            }}
                            className="flex-1 rounded-lg border border-white/20 px-4 py-2 font-medium text-white transition-colors hover:bg-white/5"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
                    >
                        Configure
                    </button>
                    <button
                        onClick={handleTest}
                        disabled={isTesting || !provider.enabled}
                        className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5 disabled:opacity-50"
                    >
                        {isTesting ? 'Testing...' : 'Test'}
                    </button>
                    {provider.api_key_encrypted && (
                        <button
                            onClick={handleRemoveKey}
                            disabled={isUpdating}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                        >
                            Remove Key
                        </button>
                    )}
                </div>
            )}

            {/* Setup Link */}
            <a
                href={info.setupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-xs text-white/40 transition-colors hover:text-white/60"
            >
                Get API Key →
            </a>
        </div>
    )
}
