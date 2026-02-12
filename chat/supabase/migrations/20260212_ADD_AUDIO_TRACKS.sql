-- Migration to add audio_tracks JSONB column to personas table
-- This supports playlists and multiple audio tracks per character.

ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS audio_tracks JSONB DEFAULT '[]'::jsonb;

-- Comment describing the column structure
COMMENT ON COLUMN personas.audio_tracks IS 'Array of audio objects: {id, name, url, type}';
