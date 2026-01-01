-- Migration: Add LLM Configuration System
-- Purpose: Enable multi-LLM switching with admin control and user preferences

-- 1. Global LLM Configuration Table (Admin-controlled)
CREATE TABLE IF NOT EXISTS llm_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL CHECK (provider IN ('deepseek', 'openai', 'anthropic', 'google', 'groq', 'mistral', 'perplexity', 'openrouter')),
    model_id text NOT NULL,
    display_name text NOT NULL,
    is_default boolean DEFAULT false,
    is_enabled boolean DEFAULT true,
    requires_premium boolean DEFAULT false,
    web_search_enabled boolean DEFAULT true,
    priority integer DEFAULT 0, -- For fallback ordering
    config jsonb DEFAULT '{}', -- Provider-specific config (temperature adjustments, etc.)
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Ensure only one default model
CREATE UNIQUE INDEX IF NOT EXISTS idx_llm_config_single_default 
ON llm_config (is_default) WHERE is_default = true;

-- 2. Add user model preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_model text DEFAULT 'deepseek-chat';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS web_search_enabled boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS model_override text; -- Admin can force a specific model

-- 3. Add model calibration to personas for cross-model consistency
ALTER TABLE personas ADD COLUMN IF NOT EXISTS model_calibration jsonb DEFAULT '{}';
-- model_calibration structure:
-- {
--   "deepseek": { "temperature_adj": 0, "prompt_suffix": "" },
--   "anthropic": { "temperature_adj": -0.1, "prompt_suffix": "Be more concise." },
--   "google": { "temperature_adj": 0.1, "prompt_suffix": "" }
-- }

-- 4. Seed default LLM configurations
INSERT INTO llm_config (provider, model_id, display_name, is_default, is_enabled, requires_premium, priority)
VALUES 
    ('deepseek', 'deepseek-chat', 'DeepSeek V3', true, true, false, 100),
    ('anthropic', 'claude-3-5-sonnet-20240620', 'Claude 3.5 Sonnet', false, true, true, 90),
    ('google', 'gemini-1.5-pro-latest', 'Gemini 1.5 Pro', false, true, true, 80),
    ('openai', 'gpt-4o', 'GPT-4o', false, true, true, 70),
    ('groq', 'llama3-70b-8192', 'LLaMA3 70B (Groq)', false, true, false, 60),
    ('openrouter', 'meta-llama/llama-3.1-8b-instruct:free', 'Llama 3.1 8B (FREE)', false, true, false, 55),
    ('openrouter', 'mistralai/mistral-7b-instruct:free', 'Mistral 7B (FREE)', false, true, false, 50)
ON CONFLICT DO NOTHING;

-- 5. RLS Policies
ALTER TABLE llm_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read LLM configs
CREATE POLICY "LLM configs viewable by all"
    ON llm_config FOR SELECT
    USING (true);

-- Only admins can modify (we'll check admin status in API)
-- No insert/update/delete policies means only service_role can modify

-- 6. Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_llm_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS llm_config_updated_at ON llm_config;
CREATE TRIGGER llm_config_updated_at
    BEFORE UPDATE ON llm_config
    FOR EACH ROW
    EXECUTE FUNCTION update_llm_config_updated_at();
