"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useStudioPersona } from "./hooks/use-studio-persona"
import { IdentityTab } from "./components/identity-tab"
import { BehaviorTab } from "./components/behavior-tab"
import { VisualsTab } from "./components/visuals-tab"
import { VoiceTab } from "./components/voice-tab"
import { StoreTab } from "./components/store-tab"
import { SoulSplicer } from "./components/soul-splicer"
import { BrainParametersPanel } from "./components/brain-parameters-panel"
import { ImportExportPanel } from "@/components/studio/ImportExportPanel"
import { MODERATION_STATUS_LABELS, PersonaConfig } from "./types"
import {
    IconUser,
    IconBrain,
    IconPalette,
    IconMicrophone,
    IconShoppingBag,
    IconDeviceFloppy,
    IconRocket,
    IconArrowLeft,
    IconArrowBack,
    IconHistory,
    IconSend,
    IconX,
    IconDna,
    IconChartBar,
    IconFileDownload,
    IconPencil
} from "@tabler/icons-react"
import { toast } from "sonner"

export default function StudioPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const personaId = searchParams.get('persona_id')

    const {
        persona,
        moderationHistory,
        loading,
        saving,
        uploading,
        error,
        loadPersona,
        loadCategories,
        updateField,
        updateMetadata,
        uploadFile,
        autoCompile,
        saveDraft,
        downloadDraft,
        submitForReview,
        withdrawFromReview,
        publish
    } = useStudioPersona()

    // Load existing persona if ID provided
    useEffect(() => {
        if (personaId) {
            loadPersona(personaId)
        }
        loadCategories()
    }, [personaId, loadPersona, loadCategories])

    const handleSaveDraft = async () => {
        const savedId = await saveDraft()
        if (savedId && !personaId) {
            // Update URL with persona_id so refresh works
            router.replace(`/studio?persona_id=${savedId}`, { scroll: false })
            toast.success('Draft saved successfully!', {
                description: 'Your Soul has been saved and can be edited later.'
            })
        } else if (savedId) {
            toast.success('Changes saved!', {
                description: 'Your Soul has been updated.'
            })
        } else {
            toast.error('Failed to save draft', {
                description: error || 'Please check your inputs and try again.'
            })
        }
    }

    const handleSubmitForReview = async () => {
        const success = await submitForReview()
        if (success) {
            toast.success('Submitted for review!', {
                description: 'Your Soul will be reviewed by our team.'
            })
        } else {
            toast.error('Failed to submit', {
                description: error || 'Please try again.'
            })
        }
    }

    const handleWithdraw = async () => {
        const success = await withdrawFromReview()
        if (success) {
            toast.info('Withdrawn from review', {
                description: 'Your Soul is back in draft status.'
            })
        } else {
            toast.error('Failed to withdraw', {
                description: error || 'Please try again.'
            })
        }
    }

    const handlePublish = async () => {
        const success = await publish()
        if (success) {
            toast.success('Soul published!', {
                description: 'Your Soul is now live and available to users.'
            })
        } else {
            toast.error('Failed to publish', {
                description: error || 'Please try again.'
            })
        }
    }

    const statusInfo = MODERATION_STATUS_LABELS[persona.status]
    const canEdit = persona.status === 'draft' || persona.status === 'rejected'
    const canSubmit = persona.status === 'draft' && persona.name && persona.system_prompt
    const canWithdraw = persona.status === 'pending_review'
    const isApproved = persona.status === 'approved'

    return (
        <div className="flex h-screen flex-col text-rp-text">
            {/* Mobile Experience Warning Banner */}
            <div className="block md:hidden bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
                <div className="flex items-center gap-3">
                    <span className="text-xl">🖥️</span>
                    <div>
                        <p className="text-sm font-medium text-amber-200">Desktop View Recommended</p>
                        <p className="text-xs text-amber-200/60">For the best creation experience, use a desktop browser.</p>
                    </div>
                </div>
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between border-b border-rp-highlight-med px-6 py-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-rp-subtle transition-colors hover:text-rp-text"
                    >
                        <IconArrowLeft size={20} />
                        Back
                    </Link>
                    <div className="h-6 w-px bg-rp-highlight-med" />
                    <h1 className="text-xl font-semibold">
                        Soul Studio
                        {persona.id && (
                            <span className="ml-2 text-sm font-normal text-rp-muted">
                                Editing: {persona.name || 'Untitled'}
                            </span>
                        )}
                    </h1>

                    {/* Manager Link */}
                    <Link
                        href="/studio/manager"
                        className="flex items-center gap-2 rounded-lg border border-rp-highlight-med px-3 py-1.5 text-sm text-rp-subtle transition-colors hover:bg-rp-overlay hover:text-rp-text"
                    >
                        <IconPencil size={16} />
                        <span className="hidden sm:inline">My Souls</span>
                    </Link>

                    {/* Moderation Status Badge */}
                    {persona.id && (
                        <span className={`ml-2 inline-flex items-center gap-1 rounded-full bg-rp-overlay px-3 py-1 text-sm ${statusInfo.color}`}>
                            <span>{statusInfo.icon}</span>
                            <span>{statusInfo.label}</span>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {error && (
                        <span className="text-sm text-red-400">{error}</span>
                    )}

                    {/* Save Draft - always available for editable states */}
                    {canEdit && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={saving || !persona.name}
                            className="border-rp-highlight-med"
                        >
                            <IconDeviceFloppy size={18} className="mr-2" />
                            {saving ? 'Saving...' : 'Save Draft'}
                        </Button>
                    )}

                    {/* Download Draft - export as local file */}
                    {persona.name && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                downloadDraft()
                                toast.success('Draft downloaded!', {
                                    description: 'Your Soul has been exported as a JSON file.'
                                })
                            }}
                            className="border-rp-foam/50 text-rp-foam hover:bg-rp-foam/10"
                        >
                            <IconFileDownload size={18} className="mr-2" />
                            Download
                        </Button>
                    )}

                    {/* Submit for Review - only for drafts */}
                    {canSubmit && (
                        <Button
                            type="button"
                            onClick={handleSubmitForReview}
                            disabled={saving}
                            className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400"
                        >
                            <IconSend size={18} className="mr-2" />
                            {saving ? 'Submitting...' : 'Submit for Review'}
                        </Button>
                    )}

                    {/* Withdraw from Review - only for pending */}
                    {canWithdraw && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleWithdraw}
                            disabled={saving}
                            className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
                        >
                            <IconArrowBack size={18} className="mr-2" />
                            Withdraw
                        </Button>
                    )}

                    {/* Direct Publish - only for admins or approved personas */}
                    {(isApproved || persona.status === 'draft') && (
                        <Button
                            type="button"
                            onClick={handlePublish}
                            disabled={saving || !persona.name || !persona.system_prompt}
                            className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400"
                        >
                            <IconRocket size={18} className="mr-2" />
                            {persona.visibility === 'PUBLIC' ? 'Published ✓' : 'Publish to Store'}
                        </Button>
                    )}
                </div>
            </header>

            {/* Rejection Reason Banner */}
            {persona.status === 'rejected' && persona.rejection_reason && (
                <div className="border-b border-red-900/50 bg-red-950/30 px-6 py-3">
                    <div className="flex items-start gap-3">
                        <span className="text-red-400">❌</span>
                        <div>
                            <p className="font-medium text-red-400">Your submission was rejected</p>
                            <p className="text-sm text-red-300/80">{persona.rejection_reason}</p>
                            <p className="mt-1 text-xs text-rp-muted">
                                Please make the necessary changes and submit again.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Review Banner */}
            {persona.status === 'pending_review' && (
                <div className="border-b border-yellow-900/50 bg-yellow-950/30 px-6 py-3">
                    <div className="flex items-start gap-3">
                        <span className="text-yellow-400">⏳</span>
                        <div>
                            <p className="font-medium text-yellow-400">Awaiting Review</p>
                            <p className="text-sm text-yellow-300/80">
                                Your Soul is being reviewed by our moderation team. This usually takes 24-48 hours.
                            </p>
                            {persona.submitted_at && (
                                <p className="mt-1 text-xs text-rp-muted">
                                    Submitted: {new Date(persona.submitted_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-rp-muted">Loading...</div>
                </div>
            )}

            {/* Main Content */}
            {!loading && (
                <main className="flex-1 overflow-auto p-6">
                    <ErrorBoundary>
                        <div className="mx-auto max-w-4xl space-y-8">
                            {/* Batch Operations */}
                            <ImportExportPanel />

                            <Tabs defaultValue="identity" className="space-y-6">
                                <TabsList className="grid w-full grid-cols-7 bg-rp-surface">
                                    <TabsTrigger value="identity" className="flex items-center gap-2">
                                        <IconUser size={16} />
                                        <span className="hidden sm:inline">Identity</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="dna-splicer" className="flex items-center gap-2">
                                        <IconDna size={16} />
                                        <span className="hidden sm:inline">DNA</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="behavior" className="flex items-center gap-2">
                                        <IconBrain size={16} />
                                        <span className="hidden sm:inline">Behavior</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="visuals" className="flex items-center gap-2">
                                        <IconPalette size={16} />
                                        <span className="hidden sm:inline">Visuals</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="voice" className="flex items-center gap-2">
                                        <IconMicrophone size={16} />
                                        <span className="hidden sm:inline">Voice</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="store" className="flex items-center gap-2">
                                        <IconShoppingBag size={16} />
                                        <span className="hidden sm:inline">Store</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                                        <IconChartBar size={16} />
                                        <span className="hidden sm:inline">Analytics</span>
                                    </TabsTrigger>
                                </TabsList>

                                <div className="mt-6">
                                    <TabsContent value="identity" className="mt-0">
                                        <IdentityTab
                                            persona={persona}
                                            updateField={updateField}
                                            uploadFile={uploadFile}
                                            uploading={uploading}
                                        />
                                    </TabsContent>

                                    <TabsContent value="dna-splicer" className="mt-0">
                                        <SoulSplicer
                                            config={(persona as any).config || {}}
                                            updateConfig={(key, value) => {
                                                const currentConfig = (persona as any).config || {}
                                                updateField('config' as any, { ...currentConfig, [key]: value })
                                            }}
                                            onDistill={async (donors) => {
                                                const response = await fetch('/api/forge/distill', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ donors })
                                                })
                                                if (!response.ok) {
                                                    const data = await response.json()
                                                    throw new Error(data.error || 'DNA synthesis failed')
                                                }
                                                return response.json()
                                            }}
                                            onApply={(systemPrompt, nbb) => {
                                                updateField('system_prompt', systemPrompt)
                                                updateField('behavioral_blueprint', nbb)
                                            }}
                                        />
                                        <div className="mt-6">
                                            <BrainParametersPanel
                                                config={(persona as any).config || {}}
                                                updateConfig={(key, value) => {
                                                    const currentConfig = (persona as any).config || {}
                                                    updateField('config' as any, { ...currentConfig, [key]: value })
                                                }}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="behavior" className="mt-0">
                                        <BehaviorTab
                                            persona={persona}
                                            updateField={updateField}
                                            autoCompile={autoCompile}
                                            loading={loading}
                                        />
                                    </TabsContent>

                                    <TabsContent value="visuals" className="mt-0">
                                        <VisualsTab
                                            metadata={(persona as any).metadata || {}}
                                            updateMetadata={updateMetadata}
                                            uploadFile={uploadFile}
                                            uploading={uploading}
                                        />
                                    </TabsContent>

                                    <TabsContent value="voice" className="mt-0">
                                        <VoiceTab
                                            persona={persona}
                                            metadata={(persona as any).metadata || {}}
                                            updateField={updateField}
                                            updateMetadata={updateMetadata}
                                            uploadFile={uploadFile}
                                            uploading={uploading}
                                        />
                                    </TabsContent>

                                    <TabsContent value="store" className="mt-0">
                                        <StoreTab
                                            metadata={persona.metadata}
                                            updateMetadata={updateMetadata}
                                            config={persona.config || {}}
                                            updateConfig={(key, value) => {
                                                const currentConfig = persona.config || {}
                                                updateField('config' as any, { ...currentConfig, [key]: value })
                                            }}
                                            uploadFile={uploadFile}
                                            uploading={uploading}
                                        />
                                    </TabsContent>

                                    <TabsContent value="analytics" className="mt-0">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 pb-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rp-foam to-rp-iris">
                                                    <IconChartBar size={20} className="text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-rp-text">Soul Health Analytics</h3>
                                                    <p className="text-sm text-rp-subtle">
                                                        Track engagement and retention metrics
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Placeholder Analytics Cards */}
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="rounded-lg bg-rp-overlay p-4">
                                                    <div className="text-sm text-rp-subtle">Total Aether Earned</div>
                                                    <div className="mt-1 text-2xl font-bold text-rp-gold">0 ✧</div>
                                                </div>
                                                <div className="rounded-lg bg-rp-overlay p-4">
                                                    <div className="text-sm text-rp-subtle">Avg. Session Length</div>
                                                    <div className="mt-1 text-2xl font-bold text-rp-foam">-- min</div>
                                                </div>
                                                <div className="rounded-lg bg-rp-overlay p-4">
                                                    <div className="text-sm text-rp-subtle">Soulmate Bonds</div>
                                                    <div className="mt-1 text-2xl font-bold text-rp-rose">0</div>
                                                </div>
                                            </div>

                                            <p className="text-center text-sm text-rp-muted">
                                                Analytics will populate as users interact with your Soul.
                                            </p>
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>

                            {/* Status Bar */}
                            <div className="mt-6 flex items-center justify-between rounded-lg px-4 py-3 text-sm">
                                <div className="flex items-center gap-4">
                                    <span className="text-rp-muted">
                                        Status:{' '}
                                        <span className={statusInfo.color}>
                                            {statusInfo.icon} {statusInfo.label}
                                        </span>
                                    </span>
                                    {persona.visibility === 'PUBLIC' && (
                                        <span className="text-green-400">• Live</span>
                                    )}
                                    {persona.id && (
                                        <span className="text-rp-muted/80">
                                            ID: {persona.id}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    {moderationHistory.length > 0 && (
                                        <button className="flex items-center gap-1 text-rp-muted hover:text-rp-subtle">
                                            <IconHistory size={14} />
                                            <span>{moderationHistory.length} moderation events</span>
                                        </button>
                                    )}
                                    <span className="text-rp-muted/80">
                                        {persona.created_at && `Created: ${new Date(persona.created_at).toLocaleDateString()}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </ErrorBoundary>
                </main>
            )}
        </div>
    )
}

