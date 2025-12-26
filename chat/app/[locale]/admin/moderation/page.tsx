"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    IconCheck,
    IconX,
    IconEye,
    IconArrowLeft,
    IconRefresh,
    IconFilter,
    IconStar,
    IconStarOff
} from "@tabler/icons-react"
import Link from "next/link"
import Image from "next/image"

interface PendingPersona {
    id: string
    name: string
    description: string | null
    image_url: string | null
    system_prompt: string
    category: string | null
    tags: string[] | null
    safety_level: string | null
    status: string
    submitted_at: string | null
    owner_id: string | null
    created_at: string
}

export default function ModerationPage() {
    const [personas, setPersonas] = useState<PendingPersona[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'pending_review' | 'all'>('pending_review')
    const [selectedPersona, setSelectedPersona] = useState<PendingPersona | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [actionLoading, setActionLoading] = useState(false)

    const supabase = createClient()

    const loadPersonas = useCallback(async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('personas')
                .select('*')
                .order('submitted_at', { ascending: false })

            if (filter === 'pending_review') {
                query = query.eq('status', 'pending_review')
            }

            const { data, error } = await query.limit(50)

            if (error) throw error
            setPersonas(data || [])
        } catch (e) {
            console.error('Failed to load personas:', e)
        } finally {
            setLoading(false)
        }
    }, [supabase, filter])

    useEffect(() => {
        loadPersonas()
    }, [loadPersonas])

    const handleApprove = async (persona: PendingPersona) => {
        setActionLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            const moderatorId = userData.user?.id

            // Update persona status
            const { error: updateError } = await supabase
                .from('personas')
                .update({
                    status: 'approved',
                    visibility: 'PUBLIC',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: moderatorId
                })
                .eq('id', persona.id)

            if (updateError) throw updateError

            // Log moderation action
            await supabase.from('content_moderation').insert([{
                persona_id: persona.id,
                moderator_id: moderatorId,
                action: 'approve',
                reason: 'Approved by moderator'
            }])

            // Refresh list
            await loadPersonas()
            setSelectedPersona(null)
        } catch (e) {
            console.error('Failed to approve:', e)
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async (persona: PendingPersona) => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason')
            return
        }

        setActionLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            const moderatorId = userData.user?.id

            // Update persona status
            const { error: updateError } = await supabase
                .from('personas')
                .update({
                    status: 'rejected',
                    rejection_reason: rejectionReason,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: moderatorId
                })
                .eq('id', persona.id)

            if (updateError) throw updateError

            // Log moderation action
            await supabase.from('content_moderation').insert([{
                persona_id: persona.id,
                moderator_id: moderatorId,
                action: 'reject',
                reason: rejectionReason
            }])

            // Refresh list
            await loadPersonas()
            setSelectedPersona(null)
            setRejectionReason('')
        } catch (e) {
            console.error('Failed to reject:', e)
        } finally {
            setActionLoading(false)
        }
    }

    const handleFeature = async (persona: PendingPersona, featured: boolean) => {
        setActionLoading(true)
        try {
            const { data: userData } = await supabase.auth.getUser()
            const moderatorId = userData.user?.id

            const { error: updateError } = await supabase
                .from('personas')
                .update({ is_featured: featured })
                .eq('id', persona.id)

            if (updateError) throw updateError

            // Log moderation action
            await supabase.from('content_moderation').insert([{
                persona_id: persona.id,
                moderator_id: moderatorId,
                action: featured ? 'feature' : 'unfeature',
                reason: featured ? 'Featured by moderator' : 'Unfeatured by moderator'
            }])

            await loadPersonas()
        } catch (e) {
            console.error('Failed to feature:', e)
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-rp-base text-rp-text">
            {/* Header */}
            <header className="border-b border-rp-highlight-med px-6 py-4">
                <div className="flex items-center justify-between">
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
                            🛡️ Content Moderation
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setFilter(filter === 'pending_review' ? 'all' : 'pending_review')}
                            className="border-rp-highlight-med"
                        >
                            <IconFilter size={18} className="mr-2" />
                            {filter === 'pending_review' ? 'Showing Pending' : 'Showing All'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={loadPersonas}
                            className="border-rp-highlight-med"
                        >
                            <IconRefresh size={18} />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* List Panel */}
                <div className="h-[calc(100vh-73px)] w-1/2 overflow-auto border-r border-rp-highlight-med">
                    {loading ? (
                        <div className="flex h-full items-center justify-center">
                            <span className="text-rp-muted">Loading...</span>
                        </div>
                    ) : personas.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-rp-muted">
                            <span className="mb-4 text-4xl">✅</span>
                            <span>No pending reviews</span>
                        </div>
                    ) : (
                        <div className="divide-y divide-rp-highlight-med">
                            {personas.map((persona) => (
                                <div
                                    key={persona.id}
                                    onClick={() => setSelectedPersona(persona)}
                                    className={`cursor-pointer p-4 transition-colors ${selectedPersona?.id === persona.id
                                        ? 'bg-rp-overlay'
                                        : 'hover:bg-rp-surface'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {persona.image_url ? (
                                            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                                                <Image
                                                    src={persona.image_url}
                                                    alt={persona.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex size-16 items-center justify-center rounded-lg bg-rp-surface text-2xl">
                                                🤖
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="truncate font-medium">{persona.name}</h3>
                                                {persona.status === 'pending_review' && (
                                                    <span className="rounded-full bg-rp-gold/20 px-2 py-0.5 text-xs text-rp-gold">
                                                        Pending
                                                    </span>
                                                )}
                                                {persona.status === 'approved' && (
                                                    <span className="rounded-full bg-rp-foam/20 px-2 py-0.5 text-xs text-rp-foam">
                                                        Approved
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 truncate text-sm text-rp-subtle">
                                                {persona.description || 'No description'}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2 text-xs text-rp-muted">
                                                <span>{persona.category || 'general'}</span>
                                                <span>•</span>
                                                <span>{persona.safety_level || 'ADULT'}</span>
                                                {persona.submitted_at && (
                                                    <>
                                                        <span>•</span>
                                                        <span>
                                                            {new Date(persona.submitted_at).toLocaleDateString()}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                <div className="h-[calc(100vh-73px)] w-1/2 overflow-auto">
                    {selectedPersona ? (
                        <div className="p-6">
                            {/* Header with image */}
                            <div className="mb-6 flex items-start gap-6">
                                {selectedPersona.image_url ? (
                                    <div className="relative size-32 shrink-0 overflow-hidden rounded-xl">
                                        <Image
                                            src={selectedPersona.image_url}
                                            alt={selectedPersona.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex size-32 items-center justify-center rounded-xl bg-rp-surface text-5xl">
                                        🤖
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold">{selectedPersona.name}</h2>
                                    <p className="mt-1 text-rp-subtle">{selectedPersona.description}</p>
                                    <div className="mt-3 flex items-center gap-3">
                                        <span className="rounded bg-rp-surface px-2 py-1 text-xs">
                                            {selectedPersona.category || 'general'}
                                        </span>
                                        <span className="rounded bg-rp-surface px-2 py-1 text-xs">
                                            {selectedPersona.safety_level || 'ADULT'}
                                        </span>
                                        {selectedPersona.tags?.map((tag) => (
                                            <span key={tag} className="rounded bg-rp-iris/20 px-2 py-1 text-xs text-rp-iris">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* System Prompt */}
                            <div className="mb-6">
                                <h3 className="mb-2 text-sm font-medium text-rp-subtle">System Prompt</h3>
                                <div className="max-h-48 overflow-auto rounded-lg bg-rp-surface p-4">
                                    <pre className="whitespace-pre-wrap text-sm">{selectedPersona.system_prompt}</pre>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-rp-muted">ID:</span>
                                    <span className="ml-2 font-mono text-xs">{selectedPersona.id}</span>
                                </div>
                                <div>
                                    <span className="text-rp-muted">Submitted:</span>
                                    <span className="ml-2">
                                        {selectedPersona.submitted_at
                                            ? new Date(selectedPersona.submitted_at).toLocaleString()
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            {selectedPersona.status === 'pending_review' && (
                                <div className="border-t border-rp-highlight-med pt-6">
                                    <h3 className="mb-4 text-sm font-medium text-rp-subtle">Moderation Actions</h3>

                                    {/* Rejection Reason */}
                                    <div className="mb-4">
                                        <label className="text-sm text-rp-muted">Rejection Reason (required for reject)</label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Explain why this submission is being rejected..."
                                            className="mt-2 w-full resize-none rounded-lg border border-rp-highlight-med bg-rp-surface p-3 text-sm"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={() => handleApprove(selectedPersona)}
                                            disabled={actionLoading}
                                            className="bg-rp-foam text-rp-base hover:bg-rp-foam/80"
                                        >
                                            <IconCheck size={18} className="mr-2" />
                                            Approve & Publish
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(selectedPersona)}
                                            disabled={actionLoading || !rejectionReason.trim()}
                                            variant="outline"
                                            className="border-rp-love text-rp-love hover:bg-rp-love/20"
                                        >
                                            <IconX size={18} className="mr-2" />
                                            Reject
                                        </Button>
                                        <Link href={`/studio?persona_id=${selectedPersona.id}`}>
                                            <Button variant="outline" className="border-rp-highlight-med">
                                                <IconEye size={18} className="mr-2" />
                                                View in Studio
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Feature toggle for approved */}
                            {selectedPersona.status === 'approved' && (
                                <div className="border-t border-rp-highlight-med pt-6">
                                    <h3 className="mb-4 text-sm font-medium text-rp-subtle">Curation Actions</h3>
                                    <Button
                                        onClick={() => handleFeature(selectedPersona, !(selectedPersona as any).is_featured)}
                                        disabled={actionLoading}
                                        variant="outline"
                                        className="border-rp-gold text-rp-gold"
                                    >
                                        {(selectedPersona as any).is_featured ? (
                                            <>
                                                <IconStarOff size={18} className="mr-2" />
                                                Remove from Featured
                                            </>
                                        ) : (
                                            <>
                                                <IconStar size={18} className="mr-2" />
                                                Add to Featured
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center text-rp-muted">
                            <span className="mb-4 text-4xl">👈</span>
                            <span>Select a persona to review</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
