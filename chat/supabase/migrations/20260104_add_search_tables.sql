-- Search Statistics Table
-- Tracks usage and performance of search providers

CREATE TABLE IF NOT EXISTS public.search_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL,
    query TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    results_count INTEGER NOT NULL DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX idx_search_stats_provider ON public.search_stats(provider_name);
CREATE INDEX idx_search_stats_created_at ON public.search_stats(created_at);
CREATE INDEX idx_search_stats_user_id ON public.search_stats(user_id);

-- Enable RLS
ALTER TABLE public.search_stats ENABLE ROW LEVEL SECURITY;

-- Policies: Users can see their own stats, admins can see all
CREATE POLICY "Users can view their own search stats"
    ON public.search_stats
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert search stats"
    ON public.search_stats
    FOR INSERT
    WITH CHECK (true);

-- Grant access
GRANT SELECT ON public.search_stats TO authenticated;
GRANT INSERT ON public.search_stats TO service_role;

-- Search Provider Configuration Table (if not exists)
CREATE TABLE IF NOT EXISTS public.search_provider_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    rate_limit INTEGER DEFAULT 10,
    max_results INTEGER DEFAULT 5,
    search_depth TEXT DEFAULT 'basic',
    api_key_encrypted TEXT,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    total_response_time_ms BIGINT DEFAULT 0,
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default provider configurations
INSERT INTO public.search_provider_config (provider_name, enabled, priority, rate_limit, max_results, search_depth)
VALUES 
    ('tavily', true, 1, 10, 5, 'basic'),
    ('google', true, 2, 10, 5, 'basic'),
    ('brave', true, 3, 10, 5, 'basic'),
    ('duckduckgo', true, 4, 10, 5, 'basic')
ON CONFLICT (provider_name) DO NOTHING;

-- Enable RLS on provider config
ALTER TABLE public.search_provider_config ENABLE ROW LEVEL SECURITY;

-- Only service role can modify provider config
CREATE POLICY "Service role manages provider config"
    ON public.search_provider_config
    FOR ALL
    USING (true)
    WITH CHECK (true);

GRANT SELECT ON public.search_provider_config TO authenticated;
GRANT ALL ON public.search_provider_config TO service_role;

-- Add comment for documentation
COMMENT ON TABLE public.search_stats IS 'Tracks search API usage and performance metrics';
COMMENT ON TABLE public.search_provider_config IS 'Configuration for web search providers';
