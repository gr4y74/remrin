-- Add background_music_url column to personas table
-- This stores the URL for looping ambient/background music that plays during chat sessions
-- Separate from welcome_audio_url which is for short greeting clips

ALTER TABLE personas
ADD COLUMN IF NOT EXISTS background_music_url TEXT;

COMMENT ON COLUMN personas.background_music_url IS 'URL to background music file that loops during chat sessions (stored in Supabase Storage)';
