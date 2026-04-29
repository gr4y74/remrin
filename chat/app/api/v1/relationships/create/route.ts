import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'
import type { RelationshipType, RelationshipDirection, PermissionMatrix } from '@/lib/chat-engine/relational-graph-types'

const DEFAULT_PERMISSION_MATRICES: Record<RelationshipType, PermissionMatrix> = {
    sibling: {
        private: 'none',
        academic: 'none',
        safety_critical: 'broadcast_all',
        emotional_state: 'none',
        institutional: 'none'
    },
    guardian_child: {
        private: 'none',
        academic: 'a_to_b',
        safety_critical: 'broadcast_all',
        emotional_state: 'none',
        institutional: 'aggregate_only'
    },
    teacher_student: {
        private: 'none',
        academic: 'symmetric',
        safety_critical: 'broadcast_all',
        emotional_state: 'none',
        institutional: 'aggregate_only'
    },
    peer: {
        private: 'none',
        academic: 'none',
        safety_critical: 'broadcast_all',
        emotional_state: 'none',
        institutional: 'none'
    },
    care_team: {
        private: 'none',
        academic: 'symmetric',
        safety_critical: 'broadcast_all',
        emotional_state: 'none',
        institutional: 'aggregate_only'
    },
    custom: {
        private: 'none',
        academic: 'none',
        safety_critical: 'broadcast_all',
        emotional_state: 'none',
        institutional: 'none'
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if (!auth || !auth.tenantId) {
            return new NextResponse('Unauthorized — tenant required', { status: 401 })
        }
        if (auth.isSandbox) {
            return new NextResponse('Relationships are not available in sandbox mode', { status: 403 })
        }

        const body = await request.json()
        const {
            userA,
            userB,
            relationshipType,
            direction = 'symmetric',
            permissionMatrix
        }: {
            userA: string
            userB: string
            relationshipType: RelationshipType
            direction?: RelationshipDirection
            permissionMatrix?: PermissionMatrix
        } = body

        if (!userA || !userB || !relationshipType) {
            return new NextResponse('Missing required fields: userA, userB, relationshipType', { status: 400 })
        }

        if (userA === userB) {
            return new NextResponse('A user cannot have a relationship with themselves', { status: 400 })
        }

        const matrix = permissionMatrix ?? DEFAULT_PERMISSION_MATRICES[relationshipType] ?? DEFAULT_PERMISSION_MATRICES.custom

        // ENFORCE: private is always 'none' — hardcoded invariant
        matrix.private = 'none'
        matrix.emotional_state = matrix.emotional_state ?? 'none'

        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('user_relationships')
            .insert({
                tenant_id: auth.tenantId,
                user_a: userA,
                user_b: userB,
                relationship_type: relationshipType,
                direction,
                permission_matrix: matrix
            })
            .select()
            .single()

        if (error) {
            if (error.code === '23505') {
                return new NextResponse('Relationship already exists between these users', { status: 409 })
            }
            return new NextResponse(`Error creating relationship: ${error.message}`, { status: 500 })
        }

        return NextResponse.json({ success: true, relationship: data })
    } catch (error: any) {
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
