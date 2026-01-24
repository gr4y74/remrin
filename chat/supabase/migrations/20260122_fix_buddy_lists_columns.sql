-- ============================================================================
-- REMRIN MESSENGER - FIX: Ensure buddy_lists has all required columns
-- Migration: 20260122_fix_buddy_lists_columns
-- Purpose: Add any missing columns to buddy_lists table and create blocked_users table
-- ============================================================================

-- 1. Ensure buddy_lists has all required columns
ALTER TABLE public.buddy_lists 
ADD COLUMN IF NOT EXISTS buddy_type TEXT DEFAULT 'human',
ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS group_name TEXT DEFAULT 'Friends',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- 2. Add check constraint for buddy_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'buddy_lists_buddy_type_check'
    AND table_name = 'buddy_lists'
  ) THEN
    ALTER TABLE public.buddy_lists 
    ADD CONSTRAINT buddy_lists_buddy_type_check 
    CHECK (buddy_type IN ('human', 'bot'));
  END IF;
END $$;

-- 3. Create blocked_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 4. Enable RLS on blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for blocked_users
CREATE POLICY "Users can view their own blocks"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create their own blocks"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON public.blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_buddy_lists_persona_id 
ON public.buddy_lists(persona_id) WHERE persona_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_buddy_lists_group_name 
ON public.buddy_lists(user_id, group_name);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker 
ON public.blocked_users(blocker_id);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked 
ON public.blocked_users(blocked_id);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
