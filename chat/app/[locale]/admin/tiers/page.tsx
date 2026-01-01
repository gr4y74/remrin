"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { IconArrowLeft, IconSparkles, IconSettings2, IconHistory, IconWebhook, IconCreditCard } from '@tabler/icons-react'
import { AdminPasswordGate } from '@/components/admin/AdminPasswordGate'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

export default function TierManagementPage() {
    const [features, setFeatures] = useState<any[]>([])
    const [providers, setProviders] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [webhooks, setWebhooks] = useState<any[]>([])
    const [priceMappings, setPriceMappings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [featuresRes, providersRes, historyRes, webhooksRes, mappingsRes] = await Promise.all([
                fetch('/api/admin/features'),
                fetch('/api/admin/llm-providers'),
                fetch('/api/admin/tiers/history?limit=50'),
                fetch('/api/admin/webhooks?limit=50'),
                fetch('/api/admin/tiers/price-mapping')
            ])

            const [featuresData, providersData, historyData, webhooksData, mappingsData] = await Promise.all([
                featuresRes.json(),
                providersRes.json(),
                historyRes.json(),
                webhooksRes.json(),
                mappingsRes.json()
            ])

            setFeatures(featuresData.features || [])
            setProviders(providersData.providers || [])
            setHistory(historyData.history || [])
            setWebhooks(webhooksData.events || [])
            setPriceMappings(mappingsData.mappings || [])
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function updateFeature(featureKey: string, updates: any) {
        try {
            const feature = features.find(f => f.feature_key === featureKey)
            await fetch('/api/admin/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...feature, ...updates })
            })
            loadData()
        } catch (error) {
            console.error('Failed to update feature:', error)
        }
    }

    async function syncAllTiers() {
        try {
            const res = await fetch('/api/admin/tiers/sync')
            const data = await res.json()
            alert(`Synced ${data.updated_count} users`)
            loadData()
        } catch (error) {
            console.error('Failed to sync tiers:', error)
        }
    }

    const tierColors = {
        wanderer: 'bg-gray-500',
        soul_weaver: 'bg-blue-500',
        architect: 'bg-purple-500',
        titan: 'bg-amber-500'
    }

    if (loading) {
        return (
            <AdminPasswordGate>
                <div className="flex min-h-screen items-center justify-center bg-rp-base">
                    <div className="text-rp-text">Loading...</div>
                </div>
            </AdminPasswordGate>
        )
    }

    return (
        <AdminPasswordGate>
            <div className="min-h-screen bg-rp-base text-rp-text">
                {/* Header */}
                <header className="border-b border-rp-highlight-med px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 text-rp-subtle transition-colors hover:text-rp-text"
                            >
                                <IconArrowLeft size={20} />
                                Back to Admin
                            </Link>
                            <div className="h-6 w-px bg-rp-highlight-med" />
                            <h1 className="text-xl font-semibold">
                                💎 Tier Management
                            </h1>
                        </div>
                        <Button onClick={syncAllTiers} variant="outline">
                            Sync All Users
                        </Button>
                    </div>
                </header>

                {/* Content */}
                <main className="mx-auto max-w-7xl p-6">
                    <Tabs defaultValue="features" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="features">
                                <IconSparkles size={16} className="mr-2" />
                                Features
                            </TabsTrigger>
                            <TabsTrigger value="providers">
                                <IconSettings2 size={16} className="mr-2" />
                                LLM Providers
                            </TabsTrigger>
                            <TabsTrigger value="history">
                                <IconHistory size={16} className="mr-2" />
                                History
                            </TabsTrigger>
                            <TabsTrigger value="webhooks">
                                <IconWebhook size={16} className="mr-2" />
                                Webhooks
                            </TabsTrigger>
                            <TabsTrigger value="pricing">
                                <IconCreditCard size={16} className="mr-2" />
                                Price Mapping
                            </TabsTrigger>
                        </TabsList>

                        {/* Features Tab */}
                        <TabsContent value="features" className="space-y-4">
                            <div className="mb-4">
                                <h2 className="text-2xl font-bold">Feature Configuration</h2>
                                <p className="text-rp-subtle">Toggle features and set limits per subscription tier</p>
                            </div>

                            {features.map((feature) => (
                                <Card key={feature.id}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle>{feature.feature_name}</CardTitle>
                                                <CardDescription>{feature.feature_description}</CardDescription>
                                            </div>
                                            <Badge variant="outline">{feature.category}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-4 gap-6">
                                            {['wanderer', 'soul_weaver', 'architect', 'titan'].map((tier) => (
                                                <div key={tier} className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-3 w-3 rounded-full ${tierColors[tier as keyof typeof tierColors]}`} />
                                                        <h4 className="font-medium capitalize">
                                                            {tier.replace('_', ' ')}
                                                        </h4>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={feature[`${tier}_enabled`]}
                                                            onCheckedChange={(checked) =>
                                                                updateFeature(feature.feature_key, {
                                                                    [`${tier}_enabled`]: checked
                                                                })
                                                            }
                                                        />
                                                        <Label className="text-sm">Enabled</Label>
                                                    </div>

                                                    {feature.feature_type === 'limit' && (
                                                        <div className="space-y-1">
                                                            <Label className="text-xs text-rp-subtle">Limit</Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="Unlimited"
                                                                value={feature[`${tier}_limit`] || ''}
                                                                onChange={(e) =>
                                                                    updateFeature(feature.feature_key, {
                                                                        [`${tier}_limit`]: parseInt(e.target.value) || null
                                                                    })
                                                                }
                                                                className="h-8"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        {/* LLM Providers Tab */}
                        <TabsContent value="providers" className="space-y-4">
                            <div className="mb-4">
                                <h2 className="text-2xl font-bold">LLM Provider Management</h2>
                                <p className="text-rp-subtle">Configure available AI models per tier</p>
                            </div>

                            <div className="grid gap-4">
                                {providers.map((provider) => (
                                    <Card key={provider.id}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle>{provider.provider_name}</CardTitle>
                                                    <CardDescription>{provider.provider_description}</CardDescription>
                                                </div>
                                                <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                                                    {provider.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-rp-subtle">Default Model:</span>
                                                    <span className="ml-2 font-mono">{provider.default_model}</span>
                                                </div>
                                                <div>
                                                    <span className="text-rp-subtle">Min Tier:</span>
                                                    <span className="ml-2 capitalize">
                                                        {['wanderer', 'soul_weaver', 'architect', 'titan'][provider.min_tier_index]}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-rp-subtle">API Endpoint:</span>
                                                    <span className="ml-2 font-mono text-xs">{provider.api_endpoint}</span>
                                                </div>
                                                <div>
                                                    <span className="text-rp-subtle">Streaming:</span>
                                                    <span className="ml-2">{provider.supports_streaming ? '✅' : '❌'}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* History Tab */}
                        <TabsContent value="history" className="space-y-4">
                            <div className="mb-4">
                                <h2 className="text-2xl font-bold">Tier Change History</h2>
                                <p className="text-rp-subtle">Audit log of all tier changes</p>
                            </div>

                            <Card>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-rp-highlight-med">
                                        {history.map((entry) => (
                                            <div key={entry.id} className="flex items-center justify-between p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-2 rounded-full ${tierColors[entry.old_tier as keyof typeof tierColors]}`} />
                                                        <span className="text-sm capitalize">{entry.old_tier?.replace('_', ' ') || 'New'}</span>
                                                    </div>
                                                    <span className="text-rp-subtle">→</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-2 rounded-full ${tierColors[entry.new_tier as keyof typeof tierColors]}`} />
                                                        <span className="text-sm capitalize">{entry.new_tier.replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-rp-subtle">
                                                    <Badge variant="outline">{entry.change_reason}</Badge>
                                                    <span>{new Date(entry.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Webhooks Tab */}
                        <TabsContent value="webhooks" className="space-y-4">
                            <div className="mb-4">
                                <h2 className="text-2xl font-bold">Stripe Webhook Events</h2>
                                <p className="text-rp-subtle">Monitor and debug webhook processing</p>
                            </div>

                            <Card>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-rp-highlight-med">
                                        {webhooks.map((event) => (
                                            <div key={event.id} className="flex items-center justify-between p-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={event.processed ? 'default' : 'destructive'}>
                                                            {event.processed ? 'Processed' : 'Failed'}
                                                        </Badge>
                                                        <span className="font-mono text-sm">{event.event_type}</span>
                                                    </div>
                                                    {event.error_message && (
                                                        <p className="mt-1 text-xs text-red-500">{event.error_message}</p>
                                                    )}
                                                </div>
                                                <span className="text-sm text-rp-subtle">
                                                    {new Date(event.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Price Mapping Tab */}
                        <TabsContent value="pricing" className="space-y-4">
                            <div className="mb-4">
                                <h2 className="text-2xl font-bold">Stripe Price Mapping</h2>
                                <p className="text-rp-subtle">Map Stripe price IDs to subscription tiers</p>
                            </div>

                            <div className="grid gap-4">
                                {priceMappings.map((mapping) => (
                                    <Card key={mapping.id}>
                                        <CardContent className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-3 w-3 rounded-full ${tierColors[mapping.tier as keyof typeof tierColors]}`} />
                                                <div>
                                                    <p className="font-medium">{mapping.tier_name}</p>
                                                    <p className="font-mono text-xs text-rp-subtle">{mapping.stripe_price_id}</p>
                                                </div>
                                            </div>
                                            <Badge variant={mapping.is_active ? 'default' : 'secondary'}>
                                                {mapping.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </AdminPasswordGate>
    )
}
