"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
    IconArrowLeft,
    IconSettings,
    IconBrain,
    IconKey,
    IconRefresh,
    IconCheck,
    IconX,
    IconEye,
    IconEyeOff
} from "@tabler/icons-react"
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate"

interface LLMConfig {
    id: string
    provider: string
    model_id: string
    display_name: string
    is_default: boolean
    is_enabled: boolean
    requires_premium: boolean
    web_search_enabled: boolean
    priority: number
    api_key_configured: boolean
}

interface APIKeyConfig {
    provider: string
    envVar: string
    label: string
    placeholder: string
}

const API_KEY_CONFIGS: APIKeyConfig[] = [
    { provider: 'deepseek', envVar: 'DEEPSEEK_API_KEY', label: 'DeepSeek', placeholder: 'sk-...' },
    { provider: 'openai', envVar: 'OPENAI_API_KEY', label: 'OpenAI', placeholder: 'sk-...' },
    { provider: 'anthropic', envVar: 'ANTHROPIC_API_KEY', label: 'Anthropic', placeholder: 'sk-ant-...' },
    { provider: 'google', envVar: 'GOOGLE_GEMINI_API_KEY', label: 'Google Gemini', placeholder: 'AI...' },
    { provider: 'groq', envVar: 'GROQ_API_KEY', label: 'Groq', placeholder: 'gsk_...' },
    { provider: 'mistral', envVar: 'MISTRAL_API_KEY', label: 'Mistral', placeholder: '...' },
    { provider: 'perplexity', envVar: 'PERPLEXITY_API_KEY', label: 'Perplexity', placeholder: 'pplx-...' },
]

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState<'llm' | 'api-keys'>('llm')
    const [configs, setConfigs] = useState<LLMConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // API Keys state
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
    const [savingKey, setSavingKey] = useState<string | null>(null)

    useEffect(() => {
        fetchConfigs()
    }, [])

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/admin/llm-config')
            const data = await res.json()
            if (data.configs) {
                setConfigs(data.configs)
            }
        } catch (err) {
            console.error('Failed to fetch configs:', err)
        } finally {
            setLoading(false)
        }
    }

    const updateConfig = async (action: string, modelId: string, value?: boolean) => {
        setSaving(modelId)
        setMessage(null)

        try {
            const body: Record<string, unknown> = { action, modelId }
            if (action === 'toggle_enabled') body.enabled = value
            if (action === 'toggle_search') body.webSearchEnabled = value
            if (action === 'toggle_premium') body.requiresPremium = value

            const res = await fetch('/api/admin/llm-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_password') || ''}`
                },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                setMessage({ type: 'success', text: 'Configuration updated' })
                fetchConfigs()
            } else {
                const data = await res.json()
                setMessage({ type: 'error', text: data.error || 'Failed to update' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error' })
        } finally {
            setSaving(null)
        }
    }

    const saveApiKey = async (provider: string, envVar: string) => {
        const key = apiKeys[provider]
        if (!key) return

        setSavingKey(provider)
        setMessage(null)

        try {
            const res = await fetch('/api/admin/api-keys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_password') || ''}`
                },
                body: JSON.stringify({ provider, envVar, apiKey: key })
            })

            if (res.ok) {
                setMessage({ type: 'success', text: `${provider} API key saved` })
                setApiKeys({ ...apiKeys, [provider]: '' })
                fetchConfigs() // Refresh to show new key status
            } else {
                const data = await res.json()
                setMessage({ type: 'error', text: data.error || 'Failed to save key' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error' })
        } finally {
            setSavingKey(null)
        }
    }

    return (
        <AdminPasswordGate>
            <div className="min-h-screen bg-rp-base text-rp-text">
                {/* Header */}
                <header className="border-b border-rp-highlight-med px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 text-rp-subtle transition-colors hover:text-rp-text"
                        >
                            <IconArrowLeft size={20} />
                            Back to Admin
                        </Link>
                        <div className="h-6 w-px bg-rp-highlight-med" />
                        <h1 className="text-xl font-semibold flex items-center gap-2">
                            <IconSettings size={24} />
                            Settings
                        </h1>
                    </div>
                </header>

                {/* Tabs */}
                <div className="border-b border-rp-highlight-med">
                    <div className="mx-auto max-w-4xl flex gap-1 px-6">
                        <button
                            onClick={() => setActiveTab('llm')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'llm'
                                    ? 'border-rp-iris text-rp-text'
                                    : 'border-transparent text-rp-subtle hover:text-rp-text'
                                }`}
                        >
                            <IconBrain size={18} />
                            LLM Configuration
                        </button>
                        <button
                            onClick={() => setActiveTab('api-keys')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'api-keys'
                                    ? 'border-rp-iris text-rp-text'
                                    : 'border-transparent text-rp-subtle hover:text-rp-text'
                                }`}
                        >
                            <IconKey size={18} />
                            API Keys
                        </button>
                    </div>
                </div>

                {/* Content */}
                <main className="mx-auto max-w-4xl p-6">
                    {/* Status Message */}
                    {message && (
                        <div className={`mb-4 rounded-lg p-3 flex items-center gap-2 ${message.type === 'success'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {message.type === 'success' ? <IconCheck size={18} /> : <IconX size={18} />}
                            {message.text}
                        </div>
                    )}

                    {/* LLM Tab */}
                    {activeTab === 'llm' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">LLM Models</h2>
                                <button
                                    onClick={fetchConfigs}
                                    className="flex items-center gap-2 text-sm text-rp-subtle hover:text-rp-text transition-colors"
                                >
                                    <IconRefresh size={16} />
                                    Refresh
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-8 text-rp-subtle">Loading...</div>
                            ) : (
                                <div className="space-y-3">
                                    {configs.map((config) => (
                                        <div
                                            key={config.id}
                                            className={`rounded-xl border p-4 transition-all ${config.is_default
                                                    ? 'border-rp-iris bg-rp-iris/5'
                                                    : 'border-rp-highlight-med bg-rp-surface'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${config.api_key_configured ? 'bg-green-400' : 'bg-red-400'
                                                        }`} />
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            {config.display_name}
                                                            {config.is_default && (
                                                                <span className="text-xs bg-rp-iris/20 text-rp-iris px-2 py-0.5 rounded">
                                                                    DEFAULT
                                                                </span>
                                                            )}
                                                            {config.requires_premium && (
                                                                <span className="text-xs bg-rp-gold/20 text-rp-gold px-2 py-0.5 rounded">
                                                                    PREMIUM
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-rp-subtle">
                                                            {config.provider} • {config.model_id}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* Enable/Disable */}
                                                    <button
                                                        onClick={() => updateConfig('toggle_enabled', config.model_id, !config.is_enabled)}
                                                        disabled={saving === config.model_id}
                                                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${config.is_enabled
                                                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                                : 'bg-rp-overlay text-rp-muted hover:bg-rp-highlight-med'
                                                            }`}
                                                    >
                                                        {config.is_enabled ? 'Enabled' : 'Disabled'}
                                                    </button>

                                                    {/* Web Search */}
                                                    <button
                                                        onClick={() => updateConfig('toggle_search', config.model_id, !config.web_search_enabled)}
                                                        disabled={saving === config.model_id}
                                                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${config.web_search_enabled
                                                                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                                                : 'bg-rp-overlay text-rp-muted hover:bg-rp-highlight-med'
                                                            }`}
                                                    >
                                                        🔍 Search
                                                    </button>

                                                    {/* Set Default */}
                                                    {!config.is_default && (
                                                        <button
                                                            onClick={() => updateConfig('set_default', config.model_id)}
                                                            disabled={saving === config.model_id}
                                                            className="px-3 py-1.5 text-xs rounded-lg bg-rp-overlay text-rp-subtle hover:bg-rp-highlight-med transition-colors"
                                                        >
                                                            Set Default
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* API Keys Tab */}
                    {activeTab === 'api-keys' && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold">API Keys</h2>
                                <p className="text-sm text-rp-subtle mt-1">
                                    Configure API keys for each LLM provider. Keys are stored securely on the server.
                                </p>
                            </div>

                            <div className="rounded-xl border border-rp-gold/30 bg-rp-gold/5 p-4">
                                <p className="text-sm text-rp-gold">
                                    ⚠️ <strong>Important:</strong> API keys set here will update server environment variables.
                                    Changes require a server restart to take effect.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {API_KEY_CONFIGS.map((keyConfig) => {
                                    const llmConfig = configs.find(c => c.provider === keyConfig.provider)
                                    const isConfigured = llmConfig?.api_key_configured || false

                                    return (
                                        <div
                                            key={keyConfig.provider}
                                            className="rounded-xl border border-rp-highlight-med bg-rp-surface p-4"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-400' : 'bg-red-400'
                                                        }`} />
                                                    <span className="font-medium">{keyConfig.label}</span>
                                                    <span className="text-xs text-rp-muted">{keyConfig.envVar}</span>
                                                </div>
                                                <span className={`text-xs ${isConfigured ? 'text-green-400' : 'text-rp-muted'}`}>
                                                    {isConfigured ? '✓ Configured' : 'Not Set'}
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type={showKeys[keyConfig.provider] ? 'text' : 'password'}
                                                        value={apiKeys[keyConfig.provider] || ''}
                                                        onChange={(e) => setApiKeys({
                                                            ...apiKeys,
                                                            [keyConfig.provider]: e.target.value
                                                        })}
                                                        placeholder={keyConfig.placeholder}
                                                        className="w-full px-3 py-2 rounded-lg border border-rp-highlight-med bg-rp-overlay text-rp-text placeholder-rp-muted text-sm pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowKeys({
                                                            ...showKeys,
                                                            [keyConfig.provider]: !showKeys[keyConfig.provider]
                                                        })}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-rp-muted hover:text-rp-text"
                                                    >
                                                        {showKeys[keyConfig.provider] ? (
                                                            <IconEyeOff size={18} />
                                                        ) : (
                                                            <IconEye size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => saveApiKey(keyConfig.provider, keyConfig.envVar)}
                                                    disabled={!apiKeys[keyConfig.provider] || savingKey === keyConfig.provider}
                                                    className="px-4 py-2 rounded-lg bg-rp-iris text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rp-iris/80 transition-colors"
                                                >
                                                    {savingKey === keyConfig.provider ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </AdminPasswordGate>
    )
}
