-- API Keys Storage Table
-- Stores encrypted API keys for LLM providers
-- Allows runtime configuration without environment variable changes

-- Create the api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT UNIQUE NOT NULL,
    env_var TEXT NOT NULL,
    api_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no user access)
CREATE POLICY "Service role only" ON api_keys
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- Add index on provider
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);

-- Add api_key_configured column to llm_config if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'llm_config' AND column_name = 'api_key_configured'
    ) THEN
        ALTER TABLE llm_config ADD COLUMN api_key_configured BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Set api_key_configured to true for providers that have env vars configured
-- This will be updated dynamically when keys are saved via the admin panel
