'use client'

import { useState } from 'react'

export default function SandboxGenerator() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ apiKey: string; tenant: { slug: string } } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const provisionSandbox = async () => {
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const res = await fetch('/api/v1/sandbox/provision', {
                method: 'POST'
            })
            if (!res.ok) {
                const text = await res.text()
                throw new Error(text || 'Failed to provision sandbox')
            }
            const data = await res.json()
            setResult(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            {!result ? (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl text-center space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">Start Building in Seconds</h3>
                        <p className="text-slate-400">Provision a temporary sandbox with test data, personality schemas, and a 30-day API key.</p>
                    </div>
                    <button
                        onClick={provisionSandbox}
                        disabled={loading}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        {loading ? 'Provisioning...' : 'Provision Free Sandbox'}
                    </button>
                    {error && (
                        <p className="text-rose-400 text-sm font-medium">{error}</p>
                    )}
                </div>
            ) : (
                <div className="bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/20 p-8 rounded-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white">Sandbox Provisioned!</h3>
                            <p className="text-emerald-400/80 text-sm font-medium">Valid for 30 days. Save these credentials.</p>
                        </div>
                        <div className="bg-emerald-500/20 p-2 rounded-full">
                            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">API KEY</label>
                            <div className="flex gap-2">
                                <code className="flex-1 bg-black/40 border border-white/10 p-3 rounded-lg text-emerald-300 font-mono text-sm break-all">
                                    {result.apiKey}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(result.apiKey)}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">TENANT SLUG</label>
                            <div className="bg-black/40 border border-white/10 p-3 rounded-lg text-slate-300 font-mono text-sm">
                                {result.tenant.slug}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <p className="text-sm text-slate-400">
                            Use this key to authenticate your requests. See the Quick Start guide below for example usage.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
