/**
 * Chat Engine Configuration - Admin Page
 * 
 * Manage LLM providers, search providers, tier configuration, and API keys
 */

"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    IconArrowLeft,
    IconRobot,
    IconSearch,
    IconDiamond,
    IconKey,
    IconCheck,
    IconX,
    IconAlertCircle
} from '@tabler/icons-react'
import { AdminPasswordGate } from '@/components/admin/AdminPasswordGate'
import { PROVIDER_CONFIGS, TIER_CONFIGS, ProviderId, UserTier } from '@/lib/chat-engine/types'
import { cn } from '@/lib/utils'

interface ProviderStatus {
    id: ProviderId
    name: string
    enabled: boolean
    hasApiKey: boolean
}

interface ConfigData {
    providers: Record<ProviderId, boolean>
    searchProviders: {
        tavily: boolean
        duckduckgo: boolean
    }
    tierProviders: Record<UserTier, ProviderId[]>
    apiKeys: Record<string, boolean>
}

export default function ChatConfigPage() {
    const [config, setConfig] = useState<ConfigData | null>(null)
    const [newKeys, setNewKeys] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadConfig()
    }, [])

    async function loadConfig() {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/admin/chat-engine-config')
            if (!response.ok) {
                throw new Error('Failed to load configuration')
            }
            const data = await response.json()
            setConfig(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function saveConfig() {
        if (!config) return

        setSaving(true)
        setError(null)
        try {
            const response = await fetch('/api/admin/chat-engine-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    providers: config.providers,
                    searchProviders: config.searchProviders,
                    tierProviders: config.tierProviders,
                    newKeys: newKeys
                })
            })

            if (!response.ok) {
                const result = await response.json()
                throw new Error(result.error || 'Failed to save configuration')
            }

            setNewKeys({})
            alert('Configuration saved successfully!')
            loadConfig() // Refresh status
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    function toggleProvider(providerId: string) {
        if (!config) return
        setConfig({
            ...config,
            providers: {
                ...config.providers,
                [providerId]: !config.providers[providerId as ProviderId]
            }
        })
    }

    function toggleSearchProvider(provider: 'tavily' | 'duckduckgo') {
        if (!config) return
        setConfig({
            ...config,
            searchProviders: {
                ...config.searchProviders,
                [provider]: !config.searchProviders[provider]
            }
        })
    }

    function handleKeyChange(envVar: string, value: string) {
        setNewKeys({
            ...newKeys,
            [envVar]: value
        })
    }

    if (loading) {
        return (
            <AdminPasswordGate>
                <div className="flex min-h-screen items-center justify-center bg-rp-base">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-rp-highlight-med border-t-rp-gold" />
                        <p className="text-rp-muted">Loading configuration...</p>
                    </div>
                </div>
            </AdminPasswordGate>
        )
    }

    return (
        <AdminPasswordGate>
            <div className="min-h-screen bg-rp-base text-rp-text pb-20">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-rp-highlight-med bg-rp-base/80 px-6 py-4 backdrop-blur-md">
                    <div className="flex items-center justify-between mx-auto max-w-6xl">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 text-rp-subtle transition-colors hover:text-rp-text"
                            >
                                <IconArrowLeft size={20} />
                                Back
                            </Link>
                            <div className="h-6 w-px bg-rp-highlight-med" />
                            <h1 className="text-xl font-semibold flex items-center gap-2">
                                ⚙️ Chat Engine Config
                            </h1>
                        </div>
                        <button
                            onClick={saveConfig}
                            disabled={saving}
                            className="rounded-lg bg-rp-gold px-6 py-2 font-bold text-rp-base shadow-lg shadow-rp-gold/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save All Changes'}
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="mx-auto max-w-6xl p-6 space-y-12">
                    {error && (
                        <div className="flex items-center gap-3 rounded-lg border border-rp-love bg-rp-love/10 p-4 animate-in fade-in duration-300">
                            <IconAlertCircle size={24} className="text-rp-love" />
                            <p className="text-rp-love">{error}</p>
                        </div>
                    )}

                    {/* LLM Providers Section */}
                    <section>
                        <div className="mb-6 flex items-center gap-3 border-b border-rp-highlight-med pb-2">
                            <IconRobot size={28} className="text-rp-iris" />
                            <h2 className="text-2xl font-bold">LLM Providers</h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {Object.values(PROVIDER_CONFIGS).map((provider) => {
                                if (provider.id === 'custom') return null
                                const isEnabled = config?.providers[provider.id] ?? true
                                const hasKey = config?.apiKeys[provider.apiKeyEnv] ?? false

                                return (
                                    <div
                                        key={provider.id}
                                        className={cn(
                                            "rounded-xl border p-6 transition-all duration-300",
                                            isEnabled
                                                ? "border-rp-highlight-med bg-rp-surface shadow-md"
                                                : "border-rp-overlay bg-rp-overlay/30 grayscale"
                                        )}
                                    >
                                        <div className="mb-4 flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold flex items-center gap-2">
                                                    {provider.name}
                                                    {isEnabled && <span className="h-2 w-2 rounded-full bg-rp-foam animate-pulse" />}
                                                </h3>
                                                <p className="text-xs text-rp-muted font-mono mt-1">{provider.defaultModel}</p>
                                            </div>
                                            <button
                                                onClick={() => toggleProvider(provider.id)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                                    isEnabled ? "bg-rp-foam" : "bg-rp-highlight-med"
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                                        isEnabled ? "translate-x-6" : "translate-x-1"
                                                    )}
                                                />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-rp-highlight-low">
                                            {hasKey ? (
                                                <div className="flex items-center gap-1.5 text-rp-foam text-xs font-semibold">
                                                    <IconCheck size={14} />
                                                    API Key Configured
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-rp-love text-xs font-semibold">
                                                    <IconX size={14} />
                                                    Missing Key
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    {/* Search & Capabilities */}
                    <section>
                        <div className="mb-6 flex items-center gap-3 border-b border-rp-highlight-med pb-2">
                            <IconSearch size={28} className="text-rp-foam" />
                            <h2 className="text-2xl font-bold">Search & Capabilities</h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold">Tavily Search</h3>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                        config?.searchProviders.tavily ? "bg-rp-foam/20 text-rp-foam" : "bg-rp-muted/20 text-rp-muted"
                                    )}>
                                        {config?.searchProviders.tavily ? "Active" : "Disabled"}
                                    </span>
                                </div>
                                <p className="text-sm text-rp-subtle mb-4">Advanced AI-powered web search for real-time information.</p>
                                <div className="flex items-center gap-2 text-xs font-mono text-rp-muted">
                                    <IconKey size={14} />
                                    TAVILY_API_KEY: {config?.apiKeys['TAVILY_API_KEY'] ? '••••••••' : 'Not Set'}
                                </div>
                            </div>
                            <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold">DuckDuckGo</h3>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rp-foam/20 text-rp-foam">
                                        Active
                                    </span>
                                </div>
                                <p className="text-sm text-rp-subtle mb-4">Privacy-focused free search integration (no API key required).</p>
                                <div className="flex items-center gap-2 text-xs font-mono text-rp-muted">
                                    <IconKey size={14} />
                                    No Key Needed
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Tier Configuration Section */}
                    <section className="mb-8">
                        <div className="mb-4 flex items-center gap-3">
                            <IconDiamond size={28} className="text-rp-gold" />
                            <h2 className="text-2xl font-bold">Tier Configuration</h2>
                        </div>
                        <div className="space-y-4">
                            {Object.entries(TIER_CONFIGS).map(([tier, tierConfig]) => (
                                <div
                                    key={tier}
                                    className="rounded-xl border border-rp-highlight-med bg-rp-surface p-6"
                                >
                                    <h3 className="mb-3 text-lg font-semibold capitalize">{tier} Tier</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {tierConfig.allowedProviders.map((providerId) => (
                                            <span
                                                key={providerId}
                                                className="rounded-full bg-rp-overlay px-3 py-1 text-sm text-rp-text"
                                            >
                                                {PROVIDER_CONFIGS[providerId].name}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-3 text-sm text-rp-muted">
                                        Rate Limit: {tierConfig.rateLimitPerHour === -1 ? 'Unlimited' : `${tierConfig.rateLimitPerHour}/hour`}
                                        {' • '}
                                        Max Context: {tierConfig.maxContextLength.toLocaleString()} tokens
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* API Key Management */}
                    <section>
                        <div className="mb-6 flex items-center gap-3 border-b border-rp-highlight-med pb-2">
                            <IconKey size={28} className="text-rp-rose" />
                            <h2 className="text-2xl font-bold">API Key Management</h2>
                        </div>
                        <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-8 shadow-inner bg-opacity-50">
                            <div className="space-y-6">
                                {Object.values(PROVIDER_CONFIGS).map(p => {
                                    if (!p.apiKeyEnv) return null
                                    const isSet = config?.apiKeys[p.apiKeyEnv]

                                    return (
                                        <div key={p.apiKeyEnv} className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-bold text-rp-text flex items-center gap-2">
                                                    {p.name} Key
                                                    {isSet && <IconCheck size={14} className="text-rp-foam" />}
                                                </label>
                                                <span className="text-[10px] font-mono text-rp-muted">{p.apiKeyEnv}</span>
                                            </div>
                                            <input
                                                type="password"
                                                placeholder={isSet ? "••••••••••••••••" : "Enter API Key"}
                                                value={newKeys[p.apiKeyEnv] || ''}
                                                onChange={(e) => handleKeyChange(p.apiKeyEnv, e.target.value)}
                                                className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-4 py-2.5 text-sm ring-rp-iris/30 transition-all focus:border-rp-iris focus:outline-none focus:ring-2"
                                            />
                                        </div>
                                    )
                                })}

                                <div className="flex flex-col gap-2 pt-4 border-t border-rp-highlight-low">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-rp-text">Tavily API Key</label>
                                        <span className="text-[10px] font-mono text-rp-muted">TAVILY_API_KEY</span>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder={config?.apiKeys['TAVILY_API_KEY'] ? "••••••••••••••••" : "Enter API Key"}
                                        value={newKeys['TAVILY_API_KEY'] || ''}
                                        onChange={(e) => handleKeyChange('TAVILY_API_KEY', e.target.value)}
                                        className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-4 py-2.5 text-sm ring-rp-iris/30 transition-all focus:border-rp-iris focus:outline-none focus:ring-2"
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex items-start gap-3 rounded-lg bg-rp-iris/5 p-4 border border-rp-iris/20 text-xs text-rp-subtle italic">
                                <IconAlertCircle size={20} className="text-rp-iris flex-shrink-0" />
                                <p>
                                    Keys entered here are stored securely in the database and bypass environment variable requirements.
                                    Visible keys are masked for security. If a key is set in both .env and database, the database key takes precedence.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </AdminPasswordGate>
    )
}
