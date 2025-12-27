"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useStudioPersona } from "./hooks/use-studio-persona"
import { IdentityTab } from "./components/identity-tab"
import { BehaviorTab } from "./components/behavior-tab"
import { VisualsTab } from "./components/visuals-tab"
import { VoiceTab } from "./components/voice-tab"
import { StoreTab } from "./components/store-tab"
import { MODERATION_STATUS_LABELS } from "./types"
import {
    IconUser,
    IconBrain,
    IconPalette,
    IconMicrophone,
    IconShoppingBag,
    IconDeviceFloppy,
    IconRocket,
    IconArrowLeft,
    IconSend,
    IconArrowBack,
    IconHistory
} from "@tabler/icons-react"
import Link from "next/link"

export default function StudioPage() {
    const searchParams = useSearchParams()
    const personaId = searchParams.get('persona_id')

    const {
        persona,
        moderationHistory,
        loading,
        saving,
        error,
        loadPersona,
        loadCategories,
        updateField,
        updateMetadata,
        uploadFile,
        autoCompile,
        saveDraft,
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
        const success = await saveDraft()
        if (success) {
            console.log('Draft saved!')
        }
    }

    const handleSubmitForReview = async () => {
        const success = await submitForReview()
        if (success) {
            console.log('Submitted for review!')
        }
    }

    const handleWithdraw = async () => {
        const success = await withdrawFromReview()
        if (success) {
            console.log('Withdrawn from review')
        }
    }

    const handlePublish = async () => {
        const success = await publish()
        if (success) {
            console.log('Published!')
        }
    }

    const statusInfo = MODERATION_STATUS_LABELS[persona.status]
    const canEdit = persona.status === 'draft' || persona.status === 'rejected'
    const canSubmit = persona.status === 'draft' && persona.name && persona.system_prompt
    const canWithdraw = persona.status === 'pending_review'
    const isApproved = persona.status === 'approved'

    return (
        <div className="flex h-screen flex-col bg-rp-base text-rp-text">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-rp-highlight-med px-6 py-4">
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
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={saving || !persona.name}
                            className="border-rp-highlight-med"
                        >
                            <IconDeviceFloppy size={18} className="mr-2" />
                            {saving ? 'Saving...' : 'Save Draft'}
                        </Button>
                    )}

                    {/* Submit for Review - only for drafts */}
                    {canSubmit && (
                        <Button
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
                    <div className="mx-auto max-w-4xl">
                        <Tabs defaultValue="identity" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-5 bg-rp-surface">
                                <TabsTrigger value="identity" className="flex items-center gap-2">
                                    <IconUser size={16} />
                                    <span className="hidden sm:inline">Identity</span>
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
                            </TabsList>

                            <div className="rounded-xl border border-rp-highlight-med bg-rp-surface/50 p-6">
                                <TabsContent value="identity" className="mt-0">
                                    <IdentityTab
                                        persona={persona}
                                        updateField={updateField}
                                        uploadFile={uploadFile}
                                    />
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
                                        metadata={persona.metadata}
                                        updateMetadata={updateMetadata}
                                        uploadFile={uploadFile}
                                    />
                                </TabsContent>

                                <TabsContent value="voice" className="mt-0">
                                    <VoiceTab
                                        persona={persona}
                                        metadata={persona.metadata}
                                        updateField={updateField}
                                        updateMetadata={updateMetadata}
                                        uploadFile={uploadFile}
                                    />
                                </TabsContent>

                                <TabsContent value="store" className="mt-0">
                                    <StoreTab
                                        metadata={persona.metadata}
                                        updateMetadata={updateMetadata}
                                    />
                                </TabsContent>
                            </div>
                        </Tabs>

                        {/* Status Bar */}
                        <div className="mt-6 flex items-center justify-between rounded-lg border border-rp-highlight-med bg-rp-surface/30 px-4 py-3 text-sm">
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
                </main>
            )}
        </div>
    )
}

