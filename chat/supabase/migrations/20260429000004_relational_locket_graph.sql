-- Phase 6: Relational Locket Graph

-- 1. user_relationships table
CREATE TABLE IF NOT EXISTS user_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_a UUID NOT NULL, -- Note: In a real system these would reference auth.users(id)
    user_b UUID NOT NULL,
    relationship_type TEXT NOT NULL, -- e.g., 'sibling', 'guardian_child', 'peer'
    direction TEXT NOT NULL CHECK (direction IN ('symmetric', 'a_to_b', 'b_to_a')),
    permission_matrix JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, user_a, user_b)
);

-- 2. locket_visibility table
CREATE TABLE IF NOT EXISTS locket_visibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locket_id UUID NOT NULL REFERENCES persona_lockets(id) ON DELETE CASCADE,
    classification TEXT NOT NULL, -- 'private', 'academic', 'safety_critical', 'institutional'
    broadcast_priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. consent_log table
CREATE TABLE IF NOT EXISTS consent_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event TEXT NOT NULL,
    source_user UUID NOT NULL,
    target_user UUID NOT NULL,
    locket_id UUID REFERENCES persona_lockets(id) ON DELETE SET NULL,
    permission_rule TEXT NOT NULL,
    companion_id UUID REFERENCES personas(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Relational Locket Graph
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE locket_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for user_relationships"
    ON user_relationships FOR ALL
    USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Tenant isolation for locket_visibility"
    ON locket_visibility FOR ALL
    USING (locket_id IN (SELECT id FROM persona_lockets WHERE tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid())));

CREATE POLICY "Tenant isolation for consent_log"
    ON consent_log FOR ALL
    USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));
