-- FIXED Migration Script for OpenRouter Support
-- This version adds the unique constraint BEFORE trying to use ON CONFLICT
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/wftsctqfiqbdyllxwagi/sql

-- 1. Update llm_config table constraint to include openrouter
ALTER TABLE llm_config DROP CONSTRAINT IF EXISTS llm_config_provider_check;

ALTER TABLE llm_config ADD CONSTRAINT llm_config_provider_check 
CHECK (provider IN ('deepseek', 'openai', 'anthropic', 'google', 'groq', 'mistral', 'perplexity', 'openrouter'));

-- 2. Add unique constraint (required for ON CONFLICT to work)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'llm_config_provider_model_key'
    ) THEN
        ALTER TABLE llm_config ADD CONSTRAINT llm_config_provider_model_key UNIQUE (provider, model_id);
    END IF;
END $$;

-- 3. Add free OpenRouter models
INSERT INTO llm_config (provider, model_id, display_name, is_default, is_enabled, requires_premium, priority)
VALUES 
    ('openrouter', 'meta-llama/llama-3.1-8b-instruct:free', 'Llama 3.1 8B (FREE)', false, true, false, 55),
    ('openrouter', 'mistralai/mistral-7b-instruct:free', 'Mistral 7B (FREE)', false, true, false, 50)
ON CONFLICT (provider, model_id) DO NOTHING;

-- 4. Verify the changes
SELECT provider, model_id, display_name, is_enabled, requires_premium 
FROM llm_config 
WHERE provider = 'openrouter'
ORDER BY priority DESC;
