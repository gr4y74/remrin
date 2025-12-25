"use client"

import { Label } from "@/components/ui/label"
import { Tables, TablesUpdate } from "@/supabase/types"
import { IconHeart } from "@tabler/icons-react"
import Image from "next/image"
import { FC, useState } from "react"
import { SidebarItem } from "../all/sidebar-display-item"

interface PersonaItemProps {
    persona: Tables<"personas">
}

// Safety level badge colors
const SAFETY_COLORS: Record<string, { bg: string; text: string }> = {
    CHILD: { bg: "bg-rp-foam/20", text: "text-rp-foam" },
    TEEN: { bg: "bg-rp-gold/20", text: "text-rp-gold" },
    ADULT: { bg: "bg-rp-love/20", text: "text-rp-love" }
}

export const PersonaItem: FC<PersonaItemProps> = ({ persona }) => {
    const [isTyping, setIsTyping] = useState(false)
    const [name, setName] = useState(persona.name)

    const safetyLevel = persona.safety_level || "ADULT"
    const safetyStyle = SAFETY_COLORS[safetyLevel] || SAFETY_COLORS.ADULT

    // Create a custom icon with the persona's image if available
    const personaIcon = persona.image_url ? (
        <Image
            src={persona.image_url}
            alt={persona.name}
            width={30}
            height={30}
            className="rounded-full object-cover"
        />
    ) : (
        <IconHeart height={30} width={30} className="text-rp-rose" />
    )

    return (
        <SidebarItem
            item={persona}
            isTyping={isTyping}
            contentType="personas"
            icon={personaIcon}
            updateState={
                {
                    name
                } as TablesUpdate<"personas">
            }
            renderInputs={() => (
                <>
                    {/* Display-only info for personas (they're created in the Forge) */}
                    <div className="space-y-3">
                        {persona.image_url && (
                            <div className="flex justify-center">
                                <Image
                                    src={persona.image_url}
                                    alt={persona.name}
                                    width={100}
                                    height={100}
                                    className="rounded-lg object-cover"
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label>Name</Label>
                            <div className="text-lg font-semibold">{persona.name}</div>
                        </div>

                        <div className="space-y-1">
                            <Label>Safety Level</Label>
                            <div
                                className={`inline-block rounded px-2 py-1 text-xs font-bold ${safetyStyle.bg} ${safetyStyle.text}`}
                            >
                                {safetyLevel}
                            </div>
                        </div>

                        {persona.system_prompt && (
                            <div className="space-y-1">
                                <Label>Personality</Label>
                                <div className="text-muted-foreground max-h-32 overflow-y-auto text-sm">
                                    {persona.system_prompt.slice(0, 200)}
                                    {persona.system_prompt.length > 200 ? "..." : ""}
                                </div>
                            </div>
                        )}

                        {persona.voice_id && (
                            <div className="space-y-1">
                                <Label>Voice ID</Label>
                                <div className="text-muted-foreground text-xs">
                                    {persona.voice_id}
                                </div>
                            </div>
                        )}

                        <div className="text-muted-foreground pt-2 text-xs italic">
                            Personas are created in the Soul Forge. Click to start chatting!
                        </div>
                    </div>
                </>
            )}
        />
    )
}
