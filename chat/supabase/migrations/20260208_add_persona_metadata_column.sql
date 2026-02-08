-- Migration: Add metadata column to personas table
ALTER TABLE personas ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN personas.metadata IS 'Flexible metadata for persona-specific settings and state';
