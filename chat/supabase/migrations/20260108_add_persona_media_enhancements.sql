-- Add background_url and is_default_media_set columns to personas table
-- This allows admins to set default media that persists across server restarts

ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS background_url TEXT,
ADD COLUMN IF NOT EXISTS is_default_media_set BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN personas.background_url IS 'URL to the background image for this persona';
COMMENT ON COLUMN personas.is_default_media_set IS 'Flag indicating if media (image/video/background) should persist as default across server restarts';

-- Create persona_backgrounds storage bucket if it doesn't exist
-- This needs to be run in Supabase Dashboard SQL Editor or via API
INSERT INTO storage.buckets (id, name, public)
VALUES ('persona_backgrounds', 'persona_backgrounds', true)
ON CONFLICT (id) DO NOTHING;
