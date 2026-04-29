/**
 * Relational Locket Graph Engine
 *
 * Implements cross-user shared memory with scoped permissions and
 * safety-critical broadcast override (The Peanut Allergy Model).
 *
 * INVARIANT: 'private' classification NEVER crosses user boundaries.
 * All cross-persona reads are logged to the consent_log table.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { PermissionMatrix, LocketClassification } from '../chat-engine/relational-graph-types'

export interface RelationalLocket {
    locketId: string
    content: string
    classification: LocketClassification
    broadcastPriority: number
    sourceUserId: string
    relationshipType: string
    permissionRule: string
}

export interface RelationalGraphContext {
    safetyBroadcasts: RelationalLocket[]   // safety_critical — interrupts conversation
    sharedLockets: RelationalLocket[]       // academic, institutional — informational
    hasSafetyOverride: boolean
}

/**
 * Determines whether the current user can read a locket of a given
 * classification based on the relationship direction and permission matrix.
 *
 * Private ALWAYS returns false — enforced at this layer regardless of matrix config.
 */
function canRead(
    classification: LocketClassification,
    permissionMatrix: PermissionMatrix,
    currentUserIsA: boolean
): boolean {
    // CRITICAL: private-tier objects NEVER cross user boundaries
    if (classification === 'private' || classification === 'emotional_state') return false

    const rule = permissionMatrix[classification]

    switch (rule) {
        case 'broadcast_all':
        case 'symmetric':
            return true
        case 'a_to_b':
            // The source is user_a; current user is B reading A's lockets
            return !currentUserIsA
        case 'b_to_a':
            // The source is user_b; current user is A reading B's lockets
            return currentUserIsA
        case 'aggregate_only':
            // We allow reads but caller should only surface anonymized summaries
            return true
        case 'none':
        default:
            return false
    }
}

/**
 * Logs a cross-persona locket read to the consent_log table.
 * Fire-and-forget — must not block inference.
 */
async function logConsentRead(
    supabase: SupabaseClient,
    params: {
        sourceUser: string
        targetUser: string
        locketId: string
        permissionRule: string
        companionId: string
        tenantId: string
    }
): Promise<void> {
    supabase
        .from('consent_log')
        .insert({
            event: 'cross_persona_locket_read',
            source_user: params.sourceUser,
            target_user: params.targetUser,
            locket_id: params.locketId,
            permission_rule: params.permissionRule,
            companion_id: params.companionId,
            tenant_id: params.tenantId
        })
        .then(({ error }) => {
            if (error) console.error('[ConsentLog] Failed to log cross-persona read:', error.message)
        })
}

/**
 * Main inference-time function.
 *
 * Queries user_relationships for the current user within their tenant,
 * then retrieves all permitted cross-user Locket objects, logs consent,
 * and returns structured context for prompt injection.
 */
export async function buildRelationalContext(
    supabase: SupabaseClient,
    userId: string,
    tenantId: string,
    companionId: string
): Promise<RelationalGraphContext> {
    const result: RelationalGraphContext = {
        safetyBroadcasts: [],
        sharedLockets: [],
        hasSafetyOverride: false
    }

    try {
        // 1. Find all relationships for the current user in this tenant
        const { data: relationships, error: relError } = await supabase
            .from('user_relationships')
            .select('*')
            .eq('tenant_id', tenantId)
            .or(`user_a.eq.${userId},user_b.eq.${userId}`)

        if (relError || !relationships || relationships.length === 0) return result

        // 2. For each relationship, retrieve permitted Locket objects
        await Promise.all(
            relationships.map(async (rel) => {
                const currentUserIsA = rel.user_a === userId
                const relatedUserId = currentUserIsA ? rel.user_b : rel.user_a
                const permissionMatrix = rel.permission_matrix as PermissionMatrix

                // 3. Get all personas belonging to the related user within this tenant
                const { data: relatedPersonas } = await supabase
                    .from('personas')
                    .select('id')
                    .eq('tenant_id', tenantId)

                if (!relatedPersonas || relatedPersonas.length === 0) return

                const relatedPersonaIds = relatedPersonas.map((p: any) => p.id)

                // 4. Get lockets from related personas that have visibility classifications
                const { data: visibleLockets } = await supabase
                    .from('persona_lockets')
                    .select(`
                        id,
                        content,
                        persona_id,
                        locket_visibility (
                            classification,
                            broadcast_priority
                        )
                    `)
                    .in('persona_id', relatedPersonaIds)
                    .not('locket_visibility', 'is', null)

                if (!visibleLockets || visibleLockets.length === 0) return

                // 5. Filter by permission matrix
                for (const locket of visibleLockets) {
                    const visibility = (locket as any).locket_visibility as any
                    if (!visibility) continue

                    const classification = visibility.classification as LocketClassification
                    const broadcastPriority = visibility.broadcast_priority ?? 0

                    if (!canRead(classification, permissionMatrix, currentUserIsA)) continue

                    const rule = permissionMatrix[classification] ?? 'unknown'

                    const relationalLocket: RelationalLocket = {
                        locketId: locket.id,
                        content: locket.content,
                        classification,
                        broadcastPriority,
                        sourceUserId: relatedUserId,
                        relationshipType: rel.relationship_type,
                        permissionRule: rule
                    }

                    // 6. Categorize — safety_critical goes to safetyBroadcasts
                    if (classification === 'safety_critical') {
                        result.safetyBroadcasts.push(relationalLocket)
                        result.hasSafetyOverride = true
                    } else {
                        result.sharedLockets.push(relationalLocket)
                    }

                    // 7. Log consent read (fire-and-forget)
                    logConsentRead(supabase, {
                        sourceUser: relatedUserId,
                        targetUser: userId,
                        locketId: locket.id,
                        permissionRule: rule,
                        companionId,
                        tenantId
                    })
                }
            })
        )

        // Sort safety broadcasts by priority descending
        result.safetyBroadcasts.sort((a, b) => b.broadcastPriority - a.broadcastPriority)

        return result
    } catch (e) {
        console.error('[RelationalGraph] Error building relational context:', e)
        return result
    }
}

/**
 * Renders the relational graph context into prompt-injectable text blocks.
 */
export function renderRelationalContext(ctx: RelationalGraphContext): string {
    if (ctx.safetyBroadcasts.length === 0 && ctx.sharedLockets.length === 0) return ''

    const parts: string[] = []

    if (ctx.safetyBroadcasts.length > 0) {
        parts.push(
            `[⚠️ SAFETY BROADCAST — OVERRIDE ACTIVE]\n` +
            `The following safety-critical facts about people connected to this user have been shared by their companions.\n` +
            `You MUST acknowledge and act on these before continuing any conversation about the related topics:\n` +
            ctx.safetyBroadcasts
                .map(l => `- [${l.relationshipType.toUpperCase()}] ${l.content}`)
                .join('\n')
        )
    }

    if (ctx.sharedLockets.length > 0) {
        parts.push(
            `[🔗 SHARED RELATIONAL CONTEXT]\n` +
            `The following facts have been shared with your companion by connected users' companions (with permission):\n` +
            ctx.sharedLockets
                .map(l => `- [${l.classification} | ${l.relationshipType}] ${l.content}`)
                .join('\n')
        )
    }

    return parts.join('\n\n')
}
