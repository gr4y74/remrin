"use client"

import { useEffect, useState } from "react"
import { IconRefresh, IconCheck, IconX, IconSearch, IconBrain, IconCrown, IconSettings } from "@tabler/icons-react"
import { toast } from "sonner"

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

export default function LLMConfigPage() {
    const [configs, setConfigs] = useState<LLMConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [password, setPassword] = useState("")
    const [authenticated, setAuthenticated] = useState(false)
    const [testMessage, setTestMessage] = useState("")
    const [testingModel, setTestingModel] = useState<string | null>(null)

    useEffect(() => {
        if (authenticated) {
            fetchConfigs()
        }
    }, [authenticated])

    const fetchConfigs = async () => {
        try {
            const res = await fetch("/api/admin/llm-config")
            const data = await res.json()
            setConfigs(data.configs || [])
        } catch (error) {
            toast.error("Failed to fetch configurations")
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (action: string, modelId: string, payload: Record<string, any> = {}) => {
        try {
            const res = await fetch("/api/admin/llm-config", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${password}`
                },
                body: JSON.stringify({ action, modelId, ...payload })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Action failed")
            }

            toast.success("Configuration updated")
            fetchConfigs()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        setAuthenticated(true)
    }

    if (!authenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
                <div className="w-full max-w-md p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-purple-500/30">
                    <div className="text-center mb-8">
                        <IconSettings className="w-12 h-12 mx-auto text-purple-400 mb-4" />
                        <h1 className="text-2xl font-bold text-white">LLM Configuration</h1>
                        <p className="text-gray-400 mt-2">Admin access required</p>
                    </div>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter admin password"
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                        <button
                            type="submit"
                            className="w-full mt-4 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Access Dashboard
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
                <div className="animate-spin text-purple-400">
                    <IconRefresh className="w-8 h-8" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <IconBrain className="w-8 h-8 text-purple-400" />
                            LLM Configuration
                        </h1>
                        <p className="text-gray-400 mt-1">Manage AI models and switch providers on-the-fly</p>
                    </div>
                    <button
                        onClick={fetchConfigs}
                        className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-gray-300 transition-colors"
                    >
                        <IconRefresh className="w-5 h-5" />
                    </button>
                </div>

                {/* Model Cards */}
                <div className="grid gap-6">
                    {configs.map(config => (
                        <div
                            key={config.id}
                            className={`p-6 rounded-2xl border backdrop-blur-xl transition-all ${config.is_default
                                    ? "bg-purple-900/30 border-purple-500/50"
                                    : config.is_enabled
                                        ? "bg-gray-800/40 border-gray-700/50 hover:border-gray-600/50"
                                        : "bg-gray-900/40 border-gray-800/50 opacity-60"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                {/* Model Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold text-white">
                                            {config.display_name}
                                        </h3>
                                        {config.is_default && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/30 text-purple-300 rounded-full">
                                                DEFAULT
                                            </span>
                                        )}
                                        {config.requires_premium && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/30 text-yellow-300 rounded-full flex items-center gap-1">
                                                <IconCrown className="w-3 h-3" /> PREMIUM
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span className="capitalize">{config.provider}</span>
                                        <span className="text-gray-600">•</span>
                                        <code className="text-gray-500">{config.model_id}</code>
                                        <span className="text-gray-600">•</span>
                                        <span className={config.api_key_configured ? "text-green-400" : "text-red-400"}>
                                            {config.api_key_configured ? "✓ API Key" : "✗ No Key"}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {/* Set as Default */}
                                    {!config.is_default && config.is_enabled && (
                                        <button
                                            onClick={() => handleAction("set_default", config.model_id)}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            Set Default
                                        </button>
                                    )}

                                    {/* Toggle Search */}
                                    <button
                                        onClick={() => handleAction("toggle_search", config.model_id, { webSearchEnabled: !config.web_search_enabled })}
                                        className={`p-2 rounded-lg transition-colors ${config.web_search_enabled
                                                ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                                : "bg-gray-700/50 text-gray-500 hover:bg-gray-700"
                                            }`}
                                        title={config.web_search_enabled ? "Search enabled" : "Search disabled"}
                                    >
                                        <IconSearch className="w-5 h-5" />
                                    </button>

                                    {/* Toggle Premium */}
                                    <button
                                        onClick={() => handleAction("toggle_premium", config.model_id, { requiresPremium: !config.requires_premium })}
                                        className={`p-2 rounded-lg transition-colors ${config.requires_premium
                                                ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                                                : "bg-gray-700/50 text-gray-500 hover:bg-gray-700"
                                            }`}
                                        title={config.requires_premium ? "Premium required" : "Free for all"}
                                    >
                                        <IconCrown className="w-5 h-5" />
                                    </button>

                                    {/* Toggle Enabled */}
                                    <button
                                        onClick={() => handleAction("toggle_enabled", config.model_id, { enabled: !config.is_enabled })}
                                        className={`p-2 rounded-lg transition-colors ${config.is_enabled
                                                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                            }`}
                                        title={config.is_enabled ? "Enabled" : "Disabled"}
                                    >
                                        {config.is_enabled ? <IconCheck className="w-5 h-5" /> : <IconX className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Info */}
                <div className="mt-8 p-6 bg-gray-800/30 rounded-xl border border-gray-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                            <IconSearch className="w-4 h-4 text-blue-400" />
                            <span>Blue = Web search enabled</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <IconCrown className="w-4 h-4 text-yellow-400" />
                            <span>Yellow = Premium only</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <IconCheck className="w-4 h-4 text-green-400" />
                            <span>Green = Model enabled</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
