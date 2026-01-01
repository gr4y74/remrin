-- ═══════════════════════════════════════════════════════════════
-- TIER-BASED FEATURE SYSTEM
-- ═══════════════════════════════════════════════════════════════
-- 
-- This migration creates a flexible feature flag system that allows
-- admins to configure which features are available to each tier:
-- - wanderer (free)
-- - soul_weaver (pro)
-- - architect (premium)
-- - titan (enterprise)
--
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- TIER FEATURES TABLE
-- ─────────────────────────────────────────────────────────────
-- Stores feature definitions and their availability per tier

CREATE TABLE IF NOT EXISTS tier_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key TEXT UNIQUE NOT NULL,
    feature_name TEXT NOT NULL,
    feature_description TEXT,
    feature_type TEXT NOT NULL CHECK (feature_type IN ('boolean', 'limit', 'list')),
    
    -- Tier availability (boolean features)
    wanderer_enabled BOOLEAN DEFAULT false,
    soul_weaver_enabled BOOLEAN DEFAULT false,
    architect_enabled BOOLEAN DEFAULT false,
    titan_enabled BOOLEAN DEFAULT false,
    
    -- Tier limits (for 'limit' type features)
    wanderer_limit INTEGER,
    soul_weaver_limit INTEGER,
    architect_limit INTEGER,
    titan_limit INTEGER,
    
    -- Tier values (for 'list' type features, stored as JSONB)
    wanderer_value JSONB,
    soul_weaver_value JSONB,
    architect_value JSONB,
    titan_value JSONB,
    
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tier_features_category ON tier_features(category);
CREATE INDEX IF NOT EXISTS idx_tier_features_key ON tier_features(feature_key);

-- ─────────────────────────────────────────────────────────────
-- LLM PROVIDERS TABLE
-- ─────────────────────────────────────────────────────────────
-- Stores available LLM providers and their configurations

CREATE TABLE IF NOT EXISTS llm_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_key TEXT UNIQUE NOT NULL,
    provider_name TEXT NOT NULL,
    provider_description TEXT,
    
    -- API Configuration
    api_endpoint TEXT NOT NULL,
    api_key_env_var TEXT,
    default_model TEXT NOT NULL,
    available_models JSONB,
    
    -- Tier availability (0=wanderer, 1=soul_weaver, 2=architect, 3=titan)
    min_tier_index INTEGER DEFAULT 0,
    
    -- Provider settings
    supports_streaming BOOLEAN DEFAULT true,
    supports_function_calling BOOLEAN DEFAULT false,
    max_tokens_limit INTEGER,
    
    -- Pricing (for display purposes)
    cost_per_1k_tokens DECIMAL(10, 6),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_providers_active ON llm_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_llm_providers_tier ON llm_providers(min_tier_index);

-- ─────────────────────────────────────────────────────────────
-- UPDATE WALLETS TABLE
-- ─────────────────────────────────────────────────────────────
-- Add user preferences for LLM provider

ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS preferred_llm_provider TEXT DEFAULT 'deepseek',
ADD COLUMN IF NOT EXISTS llm_settings JSONB DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────
-- UPDATE USER_LIMITS TABLE
-- ─────────────────────────────────────────────────────────────
-- Add tier column and migrate from is_premium

ALTER TABLE user_limits
ADD COLUMN IF NOT EXISTS tier subscription_tier DEFAULT 'wanderer';

-- Migrate existing is_premium to tier
UPDATE user_limits
SET tier = CASE 
    WHEN is_premium = true THEN 'soul_weaver'::subscription_tier
    ELSE 'wanderer'::subscription_tier
END
WHERE tier = 'wanderer';

-- Update tier from wallets where available
UPDATE user_limits ul
SET tier = w.tier
FROM wallets w
WHERE ul.user_id = w.user_id::text
  AND w.tier IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

ALTER TABLE tier_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_providers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view tier features" ON tier_features;
DROP POLICY IF EXISTS "Service role can manage tier features" ON tier_features;
DROP POLICY IF EXISTS "Anyone can view active LLM providers" ON llm_providers;
DROP POLICY IF EXISTS "Service role can manage LLM providers" ON llm_providers;

-- Public read access for tier features
CREATE POLICY "Anyone can view tier features"
    ON tier_features FOR SELECT
    USING (true);

-- Admin-only write access
CREATE POLICY "Service role can manage tier features"
    ON tier_features FOR ALL
    TO service_role
    USING (true);

-- Public read access for active LLM providers
CREATE POLICY "Anyone can view active LLM providers"
    ON llm_providers FOR SELECT
    USING (is_active = true);

-- Admin-only write access
CREATE POLICY "Service role can manage LLM providers"
    ON llm_providers FOR ALL
    TO service_role
    USING (true);

-- ─────────────────────────────────────────────────────────────
-- SEED DATA: INITIAL FEATURE DEFINITIONS
-- ─────────────────────────────────────────────────────────────

INSERT INTO tier_features (feature_key, feature_name, feature_description, feature_type, category,
  wanderer_enabled, soul_weaver_enabled, architect_enabled, titan_enabled,
  wanderer_limit, soul_weaver_limit, architect_limit, titan_limit)
VALUES
  ('daily_messages', 'Daily Message Limit', 'Maximum messages per day', 'limit', 'chat',
   true, true, true, true,
   50, 500, 999999, 999999),
   
  ('llm_provider_selection', 'LLM Provider Selection', 'Choose your preferred AI model', 'boolean', 'chat',
   false, true, true, true,
   NULL, NULL, NULL, NULL),
   
  ('max_personas', 'Maximum Personas', 'Number of personas you can create', 'limit', 'studio',
   true, true, true, true,
   3, 25, 999999, 999999),
   
  ('multi_persona_chat', 'Multi-Persona Conversations', 'Chat with multiple personas at once', 'boolean', 'chat',
   false, true, true, true,
   NULL, NULL, NULL, NULL),
   
  ('memory_search', 'Memory Search', 'Search through conversation history', 'boolean', 'chat',
   false, true, true, true,
   NULL, NULL, NULL, NULL),
   
  ('soul_splicer', 'Soul Splicer', 'Advanced persona grafting', 'boolean', 'studio',
   false, false, true, true,
   NULL, NULL, NULL, NULL),
   
  ('locket_limit', 'Locket Facts per Persona', 'Maximum immutable facts per persona', 'limit', 'studio',
   true, true, true, true,
   5, 25, 999999, 999999),
   
  ('custom_embeddings', 'Custom Embeddings', 'Use custom embedding models', 'boolean', 'advanced',
   false, false, true, true,
   NULL, NULL, NULL, NULL),
   
  ('api_access', 'API Access', 'Programmatic access to your personas', 'boolean', 'api',
   false, false, false, true,
   NULL, NULL, NULL, NULL),
   
  ('priority_support', 'Priority Support', 'Fast-track support tickets', 'boolean', 'support',
   false, false, true, true,
   NULL, NULL, NULL, NULL),
   
  ('white_label', 'White Label', 'Remove Remrin branding', 'boolean', 'enterprise',
   false, false, false, true,
   NULL, NULL, NULL, NULL)
ON CONFLICT (feature_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SEED DATA: INITIAL LLM PROVIDERS
-- ─────────────────────────────────────────────────────────────

INSERT INTO llm_providers (provider_key, provider_name, provider_description, 
  api_endpoint, api_key_env_var, default_model, available_models, 
  min_tier_index, supports_streaming, cost_per_1k_tokens, is_active)
VALUES
  ('deepseek', 'DeepSeek', 'Fast and efficient AI model, great for most conversations', 
   'https://api.deepseek.com/chat/completions', 'DEEPSEEK_API_KEY', 'deepseek-chat',
   '["deepseek-chat", "deepseek-reasoner"]'::jsonb, 0, true, 0.0001, true),
   
  ('openai', 'OpenAI GPT-4', 'Most capable model for complex reasoning and creativity',
   'https://api.openai.com/v1/chat/completions', 'OPENAI_API_KEY', 'gpt-4-turbo',
   '["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"]'::jsonb, 1, true, 0.01, true),
   
  ('claude', 'Anthropic Claude', 'Excellent for long conversations and nuanced understanding',
   'https://api.anthropic.com/v1/messages', 'ANTHROPIC_API_KEY', 'claude-3-sonnet',
   '["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"]'::jsonb, 1, true, 0.003, true),
   
  ('gemini', 'Google Gemini', 'Multimodal AI with strong reasoning capabilities',
   'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', 'GEMINI_API_KEY', 'gemini-pro',
   '["gemini-pro", "gemini-pro-vision"]'::jsonb, 1, true, 0.0005, true)
ON CONFLICT (provider_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════

-- Check tables exist:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('tier_features', 'llm_providers');

-- Check features seeded:
-- SELECT feature_key, feature_name, wanderer_enabled, soul_weaver_enabled FROM tier_features;

-- Check LLM providers seeded:
-- SELECT provider_key, provider_name, min_tier_index FROM llm_providers WHERE is_active = true;

-- Check user tier migration:
-- SELECT user_id, tier, requests_today FROM user_limits LIMIT 5;

-- ═══════════════════════════════════════════════════════════════
-- DONE! Tier-based feature system is ready.
-- ═══════════════════════════════════════════════════════════════
