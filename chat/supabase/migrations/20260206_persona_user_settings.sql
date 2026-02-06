-- Migration: Create persona_user_settings table
-- Allows users to personalize public personas with their own context

CREATE TABLE IF NOT EXISTS persona_user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Each user can only have one settings record per persona
    UNIQUE(user_id, persona_id)
);

-- Index for fast lookups
CREATE INDEX idx_persona_user_settings_user_id ON persona_user_settings(user_id);
CREATE INDEX idx_persona_user_settings_persona_id ON persona_user_settings(persona_id);
CREATE INDEX idx_persona_user_settings_composite ON persona_user_settings(user_id, persona_id);

-- Enable RLS
ALTER TABLE persona_user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own settings
CREATE POLICY "Users can view their own persona settings"
    ON persona_user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own persona settings"
    ON persona_user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persona settings"
    ON persona_user_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own persona settings"
    ON persona_user_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_persona_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_persona_user_settings_updated_at
    BEFORE UPDATE ON persona_user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_persona_user_settings_updated_at();

-- Comment on table
COMMENT ON TABLE persona_user_settings IS 'User-specific persona customizations (name, relationship, world context, preferences)';
COMMENT ON COLUMN persona_user_settings.settings IS 'JSONB containing identity, relationship, world, preferences, and voice settings';
