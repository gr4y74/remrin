-- Create search_provider_config table for managing search providers
CREATE TABLE IF NOT EXISTS search_provider_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE,
    api_key_encrypted TEXT,
    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    rate_limit INTEGER DEFAULT 100, -- requests per day
    max_results INTEGER DEFAULT 5,
    search_depth TEXT DEFAULT 'basic',
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    total_response_time_ms BIGINT DEFAULT 0,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create search_stats table for tracking usage
CREATE TABLE IF NOT EXISTS search_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL,
    query TEXT NOT NULL,
    success BOOLEAN DEFAULT true,
    response_time_ms INTEGER,
    results_count INTEGER DEFAULT 0,
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_provider_config_enabled ON search_provider_config(enabled);
CREATE INDEX IF NOT EXISTS idx_search_provider_config_priority ON search_provider_config(priority DESC);
CREATE INDEX IF NOT EXISTS idx_search_stats_provider ON search_stats(provider_name);
CREATE INDEX IF NOT EXISTS idx_search_stats_created_at ON search_stats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_stats_user_id ON search_stats(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_search_provider_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER search_provider_config_updated_at
    BEFORE UPDATE ON search_provider_config
    FOR EACH ROW
    EXECUTE FUNCTION update_search_provider_config_updated_at();

-- Insert default providers
INSERT INTO search_provider_config (provider_name, enabled, priority, rate_limit, max_results, search_depth)
VALUES 
    ('tavily', true, 1, 1000, 5, 'basic'),
    ('google', false, 2, 100, 5, 'basic'),
    ('duckduckgo', false, 3, 100, 5, 'basic'),
    ('brave', false, 4, 100, 5, 'basic')
ON CONFLICT (provider_name) DO NOTHING;

-- RLS Policies (admin only)
ALTER TABLE search_provider_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_stats ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables (admin routes will use service role)
CREATE POLICY "Service role can manage search config" ON search_provider_config
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage search stats" ON search_stats
    FOR ALL USING (auth.role() = 'service_role');
