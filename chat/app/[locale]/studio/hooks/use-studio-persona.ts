"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { StudioPersona, DEFAULT_PERSONA, PersonaMetadata, Category, ModerationAction, ModerationStatus } from "../types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""

export function useStudioPersona(initialPersonaId?: string) {
    const [persona, setPersona] = useState<StudioPersona>(DEFAULT_PERSONA)
    const [categories, setCategories] = useState<Category[]>([])
    const [moderationHistory, setModerationHistory] = useState<ModerationAction[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    // Load categories from database
    const loadCategories = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true })

            if (fetchError) throw fetchError
            if (data) setCategories(data)
        } catch (e) {
            console.error('Failed to load categories:', e)
        }
    }, [supabase])

    // Load moderation history for a persona
    const loadModerationHistory = useCallback(async (personaId: string) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('content_moderation')
                .select('*')
                .eq('persona_id', personaId)
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError
            if (data) setModerationHistory(data)
        } catch (e) {
            console.error('Failed to load moderation history:', e)
        }
    }, [supabase])

    // Load existing persona
    const loadPersona = useCallback(async (personaId: string) => {
        setLoading(true)
        setError(null)

        try {
            const { data, error: fetchError } = await supabase
                .from('personas')
                .select('*')
                .eq('id', personaId)
                .single()

            if (fetchError) throw fetchError

            if (data) {
                setPersona({
                    ...DEFAULT_PERSONA,
                    ...data,
                    status: data.status || 'draft',
                    category: data.category || 'general',
                    tags: data.tags || [],
                    metadata: data.metadata || {}
                })
                // Also load moderation history
                await loadModerationHistory(personaId)
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to load persona')
        } finally {
            setLoading(false)
        }
    }, [supabase, loadModerationHistory])

    // Update persona field
    const updateField = useCallback(<K extends keyof StudioPersona>(
        field: K,
        value: StudioPersona[K]
    ) => {
        setPersona(prev => ({ ...prev, [field]: value }))
    }, [])

    // Update metadata field
    const updateMetadata = useCallback(<K extends keyof PersonaMetadata>(
        field: K,
        value: PersonaMetadata[K]
    ) => {
        setPersona(prev => ({
            ...prev,
            metadata: { ...prev.metadata, [field]: value }
        }))
    }, [])

    // Upload file to Supabase Storage
    const uploadFile = useCallback(async (
        file: File,
        bucket: string,
        folder: string
    ): Promise<string | null> => {
        setUploading(true)
        try {
            const fileName = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName)

            return urlData.publicUrl
        } catch (e) {
            console.error('Upload failed:', e)
            return null
        } finally {
            setUploading(false)
        }
    }, [supabase])

    // Call compile-persona edge function
    const autoCompile = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/compile-persona`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: persona.name,
                    identity: persona.description,
                    tone: persona.tagline,
                    user_input_raw: persona.system_prompt
                })
            })

            const result = await response.json()

            if (result.blueprint) {
                setPersona(prev => ({
                    ...prev,
                    behavioral_blueprint: result.blueprint
                }))
            } else if (result.error) {
                throw new Error(result.error)
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Auto-compile failed')
        } finally {
            setLoading(false)
        }
    }, [persona.name, persona.description, persona.tagline, persona.system_prompt])

    // Save persona (draft)
    const saveDraft = useCallback(async (): Promise<string | null> => {
        setSaving(true)
        setError(null)

        try {
            const { data: userData } = await supabase.auth.getUser()
            const userId = userData.user?.id

            if (!userId) {
                throw new Error('You must be logged in to save')
            }

            const payload = {
                name: persona.name,
                system_prompt: persona.system_prompt,
                behavioral_blueprint: persona.behavioral_blueprint,
                image_url: persona.image_url,
                voice_id: persona.voice_id,
                safety_level: persona.safety_level,
                visibility: 'PRIVATE',
                status: persona.status || 'draft',
                category: persona.category || 'general',
                tags: persona.tags || [],
                intro_message: persona.intro_message,
                owner_id: userId,
                creator_id: userId,
                config: {
                    tagline: persona.tagline,
                    description: persona.description,
                    base_model: persona.base_model
                },
                metadata: persona.metadata
            }

            if (persona.id) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('personas')
                    .update(payload)
                    .eq('id', persona.id)

                if (updateError) throw updateError
                return persona.id
            } else {
                // Insert new
                const { data: newData, error: insertError } = await supabase
                    .from('personas')
                    .insert([payload])
                    .select()

                if (insertError) throw insertError
                if (newData?.[0]) {
                    setPersona(prev => ({ ...prev, id: newData[0].id }))
                    return newData[0].id
                }
                return null
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to save')
            return null
        } finally {
            setSaving(false)
        }
    }, [persona, supabase])

    // Submit for review (changes status to pending_review)
    const submitForReview = useCallback(async () => {
        setSaving(true)
        setError(null)

        try {
            // First save as draft if needed
            if (!persona.id) {
                const saved = await saveDraft()
                if (!saved) throw new Error('Failed to save before submitting')
            }

            const { data: userData } = await supabase.auth.getUser()
            const userId = userData.user?.id

            // Update status to pending_review
            const { error: submitError } = await supabase
                .from('personas')
                .update({
                    status: 'pending_review',
                    submitted_at: new Date().toISOString(),
                    visibility: 'PRIVATE' // Keep private until approved
                })
                .eq('id', persona.id)

            if (submitError) throw submitError

            // Log the moderation action
            await supabase.from('content_moderation').insert([{
                persona_id: persona.id,
                moderator_id: userId,
                action: 'submit',
                reason: 'Submitted for review by creator'
            }])

            setPersona(prev => ({ ...prev, status: 'pending_review' }))
            return true
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to submit for review')
            return false
        } finally {
            setSaving(false)
        }
    }, [persona.id, saveDraft, supabase])

    // Publish persona (for approved personas or direct publish for admins)
    const publish = useCallback(async () => {
        setSaving(true)
        setError(null)

        try {
            // First save as draft if needed
            if (!persona.id) {
                const saved = await saveDraft()
                if (!saved) throw new Error('Failed to save before publishing')
            }

            // Then update visibility
            const { error: publishError } = await supabase
                .from('personas')
                .update({
                    visibility: 'PUBLIC',
                    status: 'approved'
                })
                .eq('id', persona.id)

            if (publishError) throw publishError

            setPersona(prev => ({ ...prev, visibility: 'PUBLIC', status: 'approved' }))
            return true
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to publish')
            return false
        } finally {
            setSaving(false)
        }
    }, [persona.id, saveDraft, supabase])

    // Withdraw from review (back to draft)
    const withdrawFromReview = useCallback(async () => {
        if (!persona.id || persona.status !== 'pending_review') return false

        setSaving(true)
        setError(null)

        try {
            const { error: withdrawError } = await supabase
                .from('personas')
                .update({
                    status: 'draft',
                    submitted_at: null
                })
                .eq('id', persona.id)

            if (withdrawError) throw withdrawError

            setPersona(prev => ({ ...prev, status: 'draft' }))
            return true
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to withdraw')
            return false
        } finally {
            setSaving(false)
        }
    }, [persona.id, persona.status, supabase])

    // Download persona as local JSON file
    const downloadDraft = useCallback(() => {
        const exportData = {
            name: persona.name,
            tagline: persona.tagline,
            description: persona.description,
            system_prompt: persona.system_prompt,
            behavioral_blueprint: persona.behavioral_blueprint,
            intro_message: persona.intro_message,
            safety_level: persona.safety_level,
            category: persona.category,
            tags: persona.tags,
            voice_id: persona.voice_id,
            image_url: persona.image_url,
            metadata: persona.metadata,
            config: persona.config,
            // Export metadata
            _exported_at: new Date().toISOString(),
            _source_id: persona.id || null
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${persona.name || 'soul'}_draft_${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        URL.revokeObjectURL(url)
        document.body.removeChild(a)
    }, [persona])

    return {
        persona,
        setPersona,
        categories,
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
    }
}

