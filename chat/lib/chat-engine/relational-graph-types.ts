/**
 * Remrin Relational Locket Graph - Types
 */

export type RelationshipType = 
    | 'sibling' 
    | 'guardian_child' 
    | 'teacher_student' 
    | 'peer' 
    | 'care_team' 
    | 'custom';

export type RelationshipDirection = 'symmetric' | 'a_to_b' | 'b_to_a';

export type LocketClassification = 
    | 'private' 
    | 'academic' 
    | 'safety_critical' 
    | 'emotional_state' 
    | 'institutional';

export interface PermissionMatrix {
    private: 'none' | 'a_to_b' | 'b_to_a' | 'symmetric';
    academic: 'none' | 'a_to_b' | 'b_to_a' | 'symmetric';
    safety_critical: 'broadcast_all' | 'none' | 'symmetric';
    emotional_state: 'none' | 'aggregate_only' | 'symmetric';
    institutional: 'none' | 'aggregate_only';
    [key: string]: any;
}

export interface UserRelationship {
    id: string;
    tenantId: string;
    userA: string;
    userB: string;
    relationshipType: RelationshipType;
    direction: RelationshipDirection;
    permissionMatrix: PermissionMatrix;
    createdAt: Date;
}

export interface LocketVisibility {
    id: string;
    locketId: string;
    classification: LocketClassification;
    broadcastPriority: number;
    createdAt: Date;
}

export interface ConsentLogEntry {
    id: string;
    event: string;
    sourceUser: string;
    targetUser: string;
    locketId?: string;
    permissionRule: string;
    companionId: string;
    tenantId: string;
    timestamp: Date;
}
