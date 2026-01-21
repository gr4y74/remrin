-- ============================================================================
-- REMRIN MESSENGER PWA - PHASE 1: FOLLOW TO BUDDY SYNC
-- Migration: 20260121_sync_follows_to_buddies
-- Purpose: Automatically sync user follows to messenger buddy list
-- ============================================================================

-- 1. Add necessary columns to buddy_lists if they don't exist
ALTER TABLE public.buddy_lists 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS group_name TEXT DEFAULT 'Friends',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- 2. Create function to sync follows to buddy list
CREATE OR REPLACE FUNCTION sync_follows_to_buddies()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the username of the person being followed
    SELECT username INTO v_username
    FROM public.user_profiles
    WHERE user_id = NEW.following_id;
    
    -- Add to buddy list if username found
    IF v_username IS NOT NULL THEN
      INSERT INTO public.buddy_lists (
        user_id, 
        buddy_id, 
        buddy_username, 
        buddy_type, 
        group_name, 
        status
      )
      VALUES (
        NEW.follower_id,
        NEW.following_id,
        v_username,
        'human',
        'Friends',
        'accepted'
      )
      ON CONFLICT (user_id, buddy_id) 
      DO UPDATE SET 
        status = 'accepted',
        buddy_username = EXCLUDED.buddy_username; -- Update username in case it changed
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- When user unfollows, we DON'T remove from buddy list
    -- This preserves the buddy relationship even after unfollowing
    -- Users can manually remove buddies if they want
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger on user_follows
DROP TRIGGER IF EXISTS sync_follows_trigger ON public.user_follows;
CREATE TRIGGER sync_follows_trigger
AFTER INSERT OR DELETE ON public.user_follows
FOR EACH ROW 
EXECUTE FUNCTION sync_follows_to_buddies();

-- 4. Backfill existing follows to buddy list
-- This adds all current follows as buddies
INSERT INTO public.buddy_lists (
  user_id, 
  buddy_id, 
  buddy_username, 
  buddy_type, 
  group_name, 
  status
)
SELECT DISTINCT
  uf.follower_id,
  uf.following_id,
  up.username,
  'human',
  'Friends',
  'accepted'
FROM public.user_follows uf
JOIN public.user_profiles up ON up.user_id = uf.following_id
WHERE uf.following_id IS NOT NULL
ON CONFLICT (user_id, buddy_id) DO NOTHING;

-- 5. Create index for efficient follow lookups
CREATE INDEX IF NOT EXISTS idx_user_follows_follower 
ON public.user_follows(follower_id, following_id);

-- 6. Add comment for documentation
COMMENT ON FUNCTION sync_follows_to_buddies() IS 
'Automatically syncs user follows from main site to messenger buddy list. Follows are added as buddies but unfollows do not remove buddies.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
