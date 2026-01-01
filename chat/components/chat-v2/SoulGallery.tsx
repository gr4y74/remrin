/**
 * Soul Gallery - Grid Layout of User's Personas
 * 
 * Displays all user personas in a grid with selection capability
 */

"use client"

import React, { useEffect, useState } from 'react'
import { SoulCard } from './SoulCard'
import { getPersonasByOwnerId } from '@/db/personas'
import { IconSparkles } from '@tabler/icons-react'

export interface SoulGalleryProps {
    userId: string
    onSoulSelect?: (personaId: string, personaData: any) => void
    selectedSoulId?: string
}

export function SoulGallery({
    userId,
    onSoulSelect,
    selectedSoulId
}: SoulGalleryProps) {
    const [personas, setPersonas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadPersonas() {
            setLoading(true)
            try {
                const data = await getPersonasByOwnerId(userId)
                setPersonas(data)
            } catch (error) {
                console.error('Failed to load personas:', error)
            } finally {
                setLoading(false)
            }
        }

        if (userId) {
            loadPersonas()
        }
    }, [userId])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-rp-highlight-med border-t-rp-gold" />
                <p className="text-rp-muted">Loading your Souls...</p>
            </div>
        )
    }

    if (personas.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
                <div className="rounded-full bg-rp-overlay p-6">
                    <IconSparkles size={48} className="text-rp-muted" />
                </div>
                <div className="text-center">
                    <h3 className="mb-2 text-xl font-semibold text-rp-text">
                        No Souls Yet
                    </h3>
                    <p className="text-rp-muted">
                        Visit the Soul Studio to create your first persona
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-6 text-center">
                <h2 className="mb-2 text-2xl font-bold text-rp-text">
                    Choose Your Soul
                </h2>
                <p className="text-rp-muted">
                    Select a persona to start chatting
                </p>
            </div>

            {/* Grid of souls */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {personas.map((persona) => (
                    <SoulCard
                        key={persona.id}
                        id={persona.id}
                        name={persona.name}
                        imageUrl={persona.image_url}
                        tagline={persona.tagline || persona.description}
                        mood={persona.mood || 'neutral'}
                        isSelected={selectedSoulId === persona.id}
                        onClick={() => onSoulSelect?.(persona.id, persona)}
                    />
                ))}
            </div>
        </div>
    )
}
