-- Add voice_id column to personas table for TTS voice mapping
-- Migration: 20260120_voice_personas.sql

-- Add voice_id column to store ElevenLabs voice ID
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS voice_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_personas_voice_id ON personas(voice_id);

-- Add comment for documentation
COMMENT ON COLUMN personas.voice_id IS 'ElevenLabs voice ID for TTS synthesis. If null, will use OpenAI TTS with auto-selected voice.';

-- Optional: Add some default voice mappings for existing personas
-- Uncomment and customize based on your voice library

-- Example voice mappings (replace with actual ElevenLabs voice IDs):
-- UPDATE personas SET voice_id = 'pNInz6obpgDQGcFmaJgB' WHERE gender = 'female' AND tone ILIKE '%warm%';
-- UPDATE personas SET voice_id = 'ErXwobaYiN019PkySvjV' WHERE gender = 'male' AND tone ILIKE '%deep%';
