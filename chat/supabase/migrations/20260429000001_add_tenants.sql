-- Add Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'free',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Tenant API Keys Table
CREATE TABLE IF NOT EXISTS tenant_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    key_hash TEXT UNIQUE NOT NULL,
    key_prefix TEXT NOT NULL,
    key_type TEXT NOT NULL CHECK (key_type IN ('production', 'sandbox')),
    name TEXT NOT NULL,
    scopes TEXT[] DEFAULT ARRAY['all'],
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for API Keys
CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_hash ON tenant_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_prefix ON tenant_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_tenant ON tenant_api_keys(tenant_id);

-- Add tenant_id to existing tables
ALTER TABLE personas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE persona_lockets ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
ALTER TABLE shared_facts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_api_keys ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies for Tenants
CREATE POLICY "Users can view their own tenants"
    ON tenants FOR SELECT
    USING (owner_user_id = auth.uid());

CREATE POLICY "Users can create tenants"
    ON tenants FOR INSERT
    WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update their own tenants"
    ON tenants FOR UPDATE
    USING (owner_user_id = auth.uid());

CREATE POLICY "Users can delete their own tenants"
    ON tenants FOR DELETE
    USING (owner_user_id = auth.uid());

-- Basic RLS Policies for API Keys
CREATE POLICY "Users can view their tenant API keys"
    ON tenant_api_keys FOR SELECT
    USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Users can manage their tenant API keys"
    ON tenant_api_keys FOR ALL
    USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

-- RLS for existing tables with tenant_id (allow access if tenant_id is null OR matches user's tenant)
-- Note: Service Role keys bypass RLS, which is what the API will likely use, but we add basic protections here.
CREATE POLICY "Tenant isolation for personas"
    ON personas FOR ALL
    USING (tenant_id IS NULL OR tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Tenant isolation for memories"
    ON memories FOR ALL
    USING (tenant_id IS NULL OR tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Tenant isolation for persona_lockets"
    ON persona_lockets FOR ALL
    USING (tenant_id IS NULL OR tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Tenant isolation for shared_facts"
    ON shared_facts FOR ALL
    USING (tenant_id IS NULL OR tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));
