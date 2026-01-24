-- ============================================================================
-- REMRIN MESSENGER PWA - PHASE 1: PROFILE UNIFICATION (FIXED)
-- Migration: 20260121_unify_profiles_fixed
-- Purpose: Extend user_profiles to serve both main site and messenger
-- ============================================================================

-- 1. Add messenger-specific settings to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS messenger_settings JSONB DEFAULT '{
  "away_message": null,
  "show_online": true,
  "sound_enabled": true,
  "notification_enabled": true
}'::jsonb;

-- 2. Add avatar_url if it doesn't exist (should already exist from profile system)
-- This is just a safety check
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 3. Skip migration from user_profiles_chat since it doesn't exist
-- Users will have default messenger_settings

-- 4. Add index for messenger queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_messenger_settings 
ON public.user_profiles USING GIN (messenger_settings);

-- 5. Update get_buddies_with_status function to use unified profiles
CREATE OR REPLACE FUNCTION public.get_buddies_with_status(p_user_id UUID)
RETURNS TABLE (
    buddy_id UUID,
    buddy_username TEXT,
    buddy_type TEXT,
    persona_id UUID,
    nickname TEXT,
    group_name TEXT,
    is_favorite BOOLEAN,
    status TEXT,
    away_message TEXT,
    last_seen TIMESTAMP WITH TIME ZONE,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bl.buddy_id,
        bl.buddy_username,
        bl.buddy_type,
        bl.persona_id,
        bl.nickname,
        bl.group_name,
        bl.is_favorite,
        CASE 
            WHEN bl.buddy_type = 'bot' THEN 'online' -- Bots are always online
            ELSE 'offline' -- Will be updated by presence system
        END as status,
        (up.messenger_settings->>'away_message')::text as away_message,
        NULL::timestamp with time zone as last_seen, -- Will be tracked by presence
        CASE
            WHEN bl.buddy_type = 'bot' THEN p.image_url
            ELSE up.avatar_url
        END as avatar_url
    FROM public.buddy_lists bl
    LEFT JOIN public.user_profiles up ON up.user_id = bl.buddy_id
    LEFT JOIN public.personas p ON p.id = bl.persona_id
    WHERE bl.user_id = p_user_id
    AND (bl.status = 'accepted' OR bl.buddy_type = 'bot')
    ORDER BY bl.is_favorite DESC, bl.group_name, bl.buddy_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to broadcast profile updates
CREATE OR REPLACE FUNCTION broadcast_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all connected clients about profile changes
  PERFORM pg_notify(
    'profile_updated',
    json_build_object(
      'user_id', NEW.user_id,
      'avatar_url', NEW.avatar_url,
      'display_name', NEW.display_name,
      'username', NEW.username
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for profile updates
DROP TRIGGER IF EXISTS trigger_broadcast_profile_update ON public.user_profiles;
CREATE TRIGGER trigger_broadcast_profile_update
AFTER UPDATE OF avatar_url, display_name, username ON public.user_profiles
FOR EACH ROW
WHEN (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url 
   OR OLD.display_name IS DISTINCT FROM NEW.display_name
   OR OLD.username IS DISTINCT FROM NEW.username)
EXECUTE FUNCTION broadcast_profile_update();

-- 8. Add comment for documentation
COMMENT ON COLUMN user_profiles.messenger_settings IS 
'Messenger-specific settings including away message, online visibility, sound and notification preferences';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
