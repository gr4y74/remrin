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
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Header */}
            <header className="border-b border-zinc-800 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <IconArrowLeft size={20} />
                            Back
                        </Link>
                        <div className="h-6 w-px bg-zinc-800" />
                        <h1 className="text-xl font-semibold">
                            🛡️ Content Moderation
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setFilter(filter === 'pending_review' ? 'all' : 'pending_review')}
                            className="border-zinc-700"
                        >
                            <IconFilter size={18} className="mr-2" />
                            {filter === 'pending_review' ? 'Showing Pending' : 'Showing All'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={loadPersonas}
                            className="border-zinc-700"
                        >
                            <IconRefresh size={18} />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* List Panel */}
                <div className="w-1/2 border-r border-zinc-800 h-[calc(100vh-73px)] overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-zinc-500">Loading...</span>
                        </div>
                    ) : personas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                            <span className="text-4xl mb-4">✅</span>
                            <span>No pending reviews</span>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {personas.map((persona) => (
                                <div
                                    key={persona.id}
                                    onClick={() => setSelectedPersona(persona)}
                                    className={`p-4 cursor-pointer transition-colors ${selectedPersona?.id === persona.id
                                            ? 'bg-zinc-800'
                                            : 'hover:bg-zinc-900'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {persona.image_url ? (
                                            <img
                                                src={persona.image_url}
                                                alt={persona.name}
                                                className="w-16 h-16 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center text-2xl">
                                                🤖
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium truncate">{persona.name}</h3>
                                                {persona.status === 'pending_review' && (
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                                                        Pending
                                                    </span>
                                                )}
                                                {persona.status === 'approved' && (
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                                                        Approved
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-zinc-400 truncate mt-1">
                                                {persona.description || 'No description'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
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
                <div className="w-1/2 h-[calc(100vh-73px)] overflow-auto">
                    {selectedPersona ? (
                        <div className="p-6">
                            {/* Header with image */}
                            <div className="flex items-start gap-6 mb-6">
                                {selectedPersona.image_url ? (
                                    <img
                                        src={selectedPersona.image_url}
                                        alt={selectedPersona.name}
                                        className="w-32 h-32 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-xl bg-zinc-800 flex items-center justify-center text-5xl">
                                        🤖
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold">{selectedPersona.name}</h2>
                                    <p className="text-zinc-400 mt-1">{selectedPersona.description}</p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="px-2 py-1 text-xs rounded bg-zinc-800">
                                            {selectedPersona.category || 'general'}
                                        </span>
                                        <span className="px-2 py-1 text-xs rounded bg-zinc-800">
                                            {selectedPersona.safety_level || 'ADULT'}
                                        </span>
                                        {selectedPersona.tags?.map((tag) => (
                                            <span key={tag} className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-400">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* System Prompt */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-zinc-400 mb-2">System Prompt</h3>
                                <div className="bg-zinc-900 rounded-lg p-4 max-h-48 overflow-auto">
                                    <pre className="text-sm whitespace-pre-wrap">{selectedPersona.system_prompt}</pre>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-zinc-500">ID:</span>
                                    <span className="ml-2 font-mono text-xs">{selectedPersona.id}</span>
                                </div>
                                <div>
                                    <span className="text-zinc-500">Submitted:</span>
                                    <span className="ml-2">
                                        {selectedPersona.submitted_at
                                            ? new Date(selectedPersona.submitted_at).toLocaleString()
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            {selectedPersona.status === 'pending_review' && (
                                <div className="border-t border-zinc-800 pt-6">
                                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Moderation Actions</h3>

                                    {/* Rejection Reason */}
                                    <div className="mb-4">
                                        <label className="text-sm text-zinc-500">Rejection Reason (required for reject)</label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Explain why this submission is being rejected..."
                                            className="w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm resize-none"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={() => handleApprove(selectedPersona)}
                                            disabled={actionLoading}
                                            className="bg-green-600 hover:bg-green-500"
                                        >
                                            <IconCheck size={18} className="mr-2" />
                                            Approve & Publish
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(selectedPersona)}
                                            disabled={actionLoading || !rejectionReason.trim()}
                                            variant="outline"
                                            className="border-red-600 text-red-400 hover:bg-red-600/20"
                                        >
                                            <IconX size={18} className="mr-2" />
                                            Reject
                                        </Button>
                                        <Link href={`/studio?persona_id=${selectedPersona.id}`}>
                                            <Button variant="outline" className="border-zinc-700">
                                                <IconEye size={18} className="mr-2" />
                                                View in Studio
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Feature toggle for approved */}
                            {selectedPersona.status === 'approved' && (
                                <div className="border-t border-zinc-800 pt-6">
                                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Curation Actions</h3>
                                    <Button
                                        onClick={() => handleFeature(selectedPersona, !(selectedPersona as any).is_featured)}
                                        disabled={actionLoading}
                                        variant="outline"
                                        className="border-amber-600 text-amber-400"
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
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                            <span className="text-4xl mb-4">👈</span>
                            <span>Select a persona to review</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
