-- Migration: 20260216_add_cockpit_preferences
-- Description: Add Cockpit-specific user preferences to user_profiles table

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS preferred_interface TEXT DEFAULT 'proper' CHECK (preferred_interface IN ('proper', 'cockpit')),
ADD COLUMN IF NOT EXISTS cockpit_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS cockpit_theme TEXT DEFAULT 'light' CHECK (cockpit_theme IN ('light', 'dark')),
ADD COLUMN IF NOT EXISTS enable_analytics BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_memory BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_thinking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_voice BOOLEAN DEFAULT false;

-- Notify user_profiles of changes for real-time (if not already enabled)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
