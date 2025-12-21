"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { StudioPersona, DEFAULT_PERSONA, PersonaMetadata } from "../types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""

export function useStudioPersona(initialPersonaId?: string) {
    const [persona, setPersona] = useState<StudioPersona>(DEFAULT_PERSONA)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

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
                    metadata: data.metadata || {}
                })
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to load persona')
        } finally {
            setLoading(false)
        }
    }, [supabase])

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
    const saveDraft = useCallback(async () => {
        setSaving(true)
        setError(null)

        try {
            const { data: userData } = await supabase.auth.getUser()
            const userId = userData.user?.id

            const payload = {
                name: persona.name,
                system_prompt: persona.system_prompt,
                behavioral_blueprint: persona.behavioral_blueprint,
                image_url: persona.image_url,
                voice_id: persona.voice_id,
                safety_level: persona.safety_level,
                visibility: 'PRIVATE',
                owner_id: userId,
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
            } else {
                // Insert new
                const { data: newData, error: insertError } = await supabase
                    .from('personas')
                    .insert([payload])
                    .select()

                if (insertError) throw insertError
                if (newData?.[0]) {
                    setPersona(prev => ({ ...prev, id: newData[0].id }))
                }
            }

            return true
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to save')
            return false
        } finally {
            setSaving(false)
        }
    }, [persona, supabase])

    // Publish persona
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
                .update({ visibility: 'PUBLIC' })
                .eq('id', persona.id)

            if (publishError) throw publishError

            setPersona(prev => ({ ...prev, visibility: 'PUBLIC' }))
            return true
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to publish')
            return false
        } finally {
            setSaving(false)
        }
    }, [persona.id, saveDraft, supabase])

    return {
        persona,
        setPersona,
        loading,
        saving,
        error,
        loadPersona,
        updateField,
        updateMetadata,
        uploadFile,
        autoCompile,
        saveDraft,
        publish
    }
}
