"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconSparkles, IconLock, IconCheck } from '@tabler/icons-react'

export default function LLMSettingsPage() {
    const [providers, setProviders] = useState<any[]>([])
    const [selectedProvider, setSelectedProvider] = useState('deepseek')
    const [userTier, setUserTier] = useState('wanderer')
    const [tierName, setTierName] = useState('Wanderer')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadProviders()
    }, [])

    async function loadProviders() {
        try {
            const res = await fetch('/api/user/llm-providers')
            const data = await res.json()
            setProviders(data.providers || [])
            setSelectedProvider(data.current_provider || 'deepseek')
            setUserTier(data.tier || 'wanderer')
            setTierName(data.tier_name || 'Wanderer')
        } catch (error) {
            console.error('Failed to load providers:', error)
        } finally {
            setLoading(false)
        }
    }

    async function updateProvider(providerKey: string) {
        setSaving(true)
        try {
            await fetch('/api/user/llm-providers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: providerKey })
            })
            setSelectedProvider(providerKey)
        } catch (error) {
            console.error('Failed to update provider:', error)
            alert('Failed to update provider')
        } finally {
            setSaving(false)
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
            <div className="flex min-h-screen items-center justify-center bg-rp-base">
                <div className="text-rp-text">Loading...</div>
            </div>
        )
    }

    const canSelectProvider = userTier !== 'wanderer'

    return (
        <div className="min-h-screen bg-rp-base p-6">
            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-rp-text">AI Model Settings</h1>
                        <p className="text-rp-subtle">Choose which AI model powers your conversations</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${tierColors[userTier as keyof typeof tierColors]}`} />
                        <Badge variant="outline">{tierName}</Badge>
                    </div>
                </div>

                {/* Provider Selection */}
                <RadioGroup value={selectedProvider} onValueChange={updateProvider} disabled={saving}>
                    <div className="grid gap-4">
                        {providers.map((provider) => {
                            const isSelected = selectedProvider === provider.provider_key
                            const isLocked = !canSelectProvider && provider.provider_key !== 'deepseek'

                            return (
                                <Card
                                    key={provider.id}
                                    className={`relative transition-all ${isSelected ? 'border-rp-iris ring-2 ring-rp-iris/20' : ''
                                        } ${isLocked ? 'opacity-60' : 'cursor-pointer hover:border-rp-highlight-high'}`}
                                >
                                    <CardHeader>
                                        <div className="flex items-start gap-4">
                                            <RadioGroupItem
                                                value={provider.provider_key}
                                                id={provider.provider_key}
                                                disabled={isLocked}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <Label
                                                    htmlFor={provider.provider_key}
                                                    className="flex items-center gap-2 text-lg font-semibold cursor-pointer"
                                                >
                                                    {provider.provider_name}
                                                    {isSelected && <IconCheck size={20} className="text-rp-iris" />}
                                                    {isLocked && <IconLock size={16} className="text-rp-muted" />}
                                                    {provider.provider_key === 'deepseek' && (
                                                        <Badge variant="secondary">Free</Badge>
                                                    )}
                                                    {provider.provider_key !== 'deepseek' && (
                                                        <Badge variant="default" className="bg-rp-iris">
                                                            <IconSparkles size={12} className="mr-1" />
                                                            Pro
                                                        </Badge>
                                                    )}
                                                </Label>
                                                <CardDescription className="mt-1">
                                                    {provider.provider_description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-4 text-sm text-rp-subtle">
                                            <div>
                                                <span className="font-medium">Model:</span>
                                                <span className="ml-2 font-mono">{provider.default_model}</span>
                                            </div>
                                            {provider.cost_per_1k_tokens && (
                                                <div>
                                                    <span className="font-medium">Cost:</span>
                                                    <span className="ml-2">${provider.cost_per_1k_tokens}/1K tokens</span>
                                                </div>
                                            )}
                                            {provider.supports_streaming && (
                                                <div>
                                                    <span className="font-medium">Streaming:</span>
                                                    <span className="ml-2">✅ Yes</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </RadioGroup>

                {/* Upgrade Prompt */}
                {!canSelectProvider && (
                    <Card className="border-rp-iris bg-rp-iris/5">
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="font-semibold text-rp-text">Unlock More AI Models</h3>
                                <p className="text-sm text-rp-subtle">
                                    Upgrade to Soul Weaver or higher to access GPT-4, Claude, and Gemini
                                </p>
                            </div>
                            <Button className="bg-rp-iris hover:bg-rp-iris/90">
                                Upgrade Now
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Save Status */}
                {saving && (
                    <div className="text-center text-sm text-rp-subtle">
                        Saving...
                    </div>
                )}
            </div>
        </div>
    )
}
