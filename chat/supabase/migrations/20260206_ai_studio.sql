-- Migration: AI Studio Infrastructure
-- Create tables for tracking AI models and user generation history

-- 1. Create ai_models table
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  model_id TEXT NOT NULL, -- Replicate model identifier (e.g., 'black-forest-labs/flux-schnell')
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'edit')),
  display_name TEXT NOT NULL,
  description TEXT,
  base_cost DECIMAL(10,4) NOT NULL DEFAULT 0.001, -- Estimated Replicate cost in USD
  aether_cost INTEGER NOT NULL DEFAULT 10, -- Cost in Aether credits
  thumbnail_url TEXT,
  sample_outputs JSONB DEFAULT '[]'::jsonb,
  parameters JSONB DEFAULT '{}'::jsonb, -- Model-specific parameters (size, quality, etc.)
  quality_tier TEXT DEFAULT 'HD' CHECK (quality_tier IN ('HD', 'Genius', 'Super Genius')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create generations table
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  output_url TEXT,
  aether_spent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  replicate_prediction_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- 4. Policies for ai_models
CREATE POLICY "Public read access for active models" 
ON ai_models FOR SELECT 
USING (is_active = true);

-- 5. Policies for generations
CREATE POLICY "Users can view their own generations" 
ON generations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generations" 
ON generations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history" 
ON generations FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_ai_models_type ON ai_models(type);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_active ON ai_models(is_active);

-- 7. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_generations_updated_at BEFORE UPDATE ON generations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
