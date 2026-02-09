/**
 * Locket Protocol Tools
 * 
 * Tools for interacting with the Locket (Immutable Truths)
 * and Shared Facts (Universal Memory).
 */

import { ToolDescriptor } from '@/lib/chat-engine/types'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// ============================================================
// TOOL SCHEMAS
// ============================================================

export const UPDATE_LOCKET_SCHEMA: ToolDescriptor = {
    type: 'function',
    function: {
        name: 'update_locket',
        description: 'Update the "Locket" (Immutable Truths) for yourself (the persona). Use this to save CRITICAL, PERMANENT facts about the user or yourself that should NEVER be forgotten. Only use for high-importance information.',
        parameters: {
            type: 'object',
            properties: {
                content: {
                    type: 'string',
                    description: 'The fact or truth to save. Be concise and clear.'
                },
                action: {
                    type: 'string',
                    enum: ['add', 'remove'],
                    description: 'Whether to add a new truth or remove an existing one.'
                }
            },
            required: ['content', 'action']
        }
    }
}

export const LOCKET_TOOLS = [UPDATE_LOCKET_SCHEMA]

// ============================================================
// HANDLERS
// ============================================================

export interface UpdateLocketParams {
    content: string
    action: 'add' | 'remove'
}

export async function handleUpdateLocket(
    params: UpdateLocketParams,
    personaId: string
) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // We assume authorization check happened in the route

    if (params.action === 'add') {
        const { error } = await supabase
            .from('persona_lockets')
            .insert({
                persona_id: personaId,
                content: params.content
            })

        if (error) {
            console.error('[Locket] Failed to add truth:', error)
            return { success: false, error: 'Failed to save truth to Locket.' }
        }

        return { success: true, message: 'Truth securely locked.' }
    }
    else if (params.action === 'remove') {
        // This is a bit trickier without an ID, so we try to match content
        const { error } = await supabase
            .from('persona_lockets')
            .delete()
            .eq('persona_id', personaId)
            .ilike('content', params.content) // Case-insensitive match

        if (error) {
            console.error('[Locket] Failed to remove truth:', error)
            return { success: false, error: 'Failed to remove truth from Locket.' }
        }

        return { success: true, message: 'Truth removed from Locket.' }
    }

    return { success: false, error: 'Invalid action' }
}
