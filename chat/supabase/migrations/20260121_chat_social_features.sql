-- Migration: Enhanced Chat Social Features
-- Agent Alpha - Core Social Infrastructure

-- =====================================================
-- BLOCKED USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own blocks
CREATE POLICY "Users can view their own blocks"
ON public.blocked_users FOR SELECT
USING (auth.uid() = blocker_id);

-- RLS: Users can add blocks
CREATE POLICY "Users can create blocks"
ON public.blocked_users FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

-- RLS: Users can remove their own blocks
CREATE POLICY "Users can delete their own blocks"
ON public.blocked_users FOR DELETE
USING (auth.uid() = blocker_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

-- =====================================================
-- ENHANCE BUDDY_LISTS TABLE
-- =====================================================
-- Add new columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buddy_lists' AND column_name = 'nickname') THEN
        ALTER TABLE public.buddy_lists ADD COLUMN nickname TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buddy_lists' AND column_name = 'group_name') THEN
        ALTER TABLE public.buddy_lists ADD COLUMN group_name TEXT DEFAULT 'Buddies';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buddy_lists' AND column_name = 'is_favorite') THEN
        ALTER TABLE public.buddy_lists ADD COLUMN is_favorite BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buddy_lists' AND column_name = 'notes') THEN
        ALTER TABLE public.buddy_lists ADD COLUMN notes TEXT;
    END IF;
END $$;

-- RLS for buddy list management (update/delete)
CREATE POLICY IF NOT EXISTS "Users can update their buddy list"
ON public.buddy_lists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete from their buddy list"
ON public.buddy_lists FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- ENHANCE DIRECT_MESSAGES TABLE
-- =====================================================
-- Add delivery and read tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'direct_messages' AND column_name = 'delivered_at') THEN
        ALTER TABLE public.direct_messages ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'direct_messages' AND column_name = 'read_at') THEN
        ALTER TABLE public.direct_messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- RLS for updating DMs (marking as read)
CREATE POLICY IF NOT EXISTS "Users can update DMs sent to them"
ON public.direct_messages FOR UPDATE
USING (auth.uid() = to_user_id);

-- =====================================================
-- ENHANCE USER_PROFILES_CHAT TABLE
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles_chat' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.user_profiles_chat ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles_chat' AND column_name = 'bio') THEN
        ALTER TABLE public.user_profiles_chat ADD COLUMN bio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles_chat' AND column_name = 'last_seen') THEN
        ALTER TABLE public.user_profiles_chat ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles_chat' AND column_name = 'member_since') THEN
        ALTER TABLE public.user_profiles_chat ADD COLUMN member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- GRANTS
-- =====================================================
GRANT ALL ON public.blocked_users TO authenticated;
GRANT ALL ON public.blocked_users TO service_role;

-- =====================================================
-- FUNCTION: Check if user is blocked
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_blocked(checker_id UUID, target_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocked_users 
        WHERE blocker_id = checker_id AND blocked_id = target_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get buddy list with online status
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_buddies_with_status(p_user_id UUID)
RETURNS TABLE (
    buddy_id UUID,
    buddy_username TEXT,
    nickname TEXT,
    group_name TEXT,
    is_favorite BOOLEAN,
    status TEXT,
    away_message TEXT,
    last_seen TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bl.buddy_id,
        bl.buddy_username,
        bl.nickname,
        bl.group_name,
        bl.is_favorite,
        COALESCE(upc.status, 'offline') as status,
        upc.away_message,
        upc.last_seen
    FROM public.buddy_lists bl
    LEFT JOIN public.user_profiles_chat upc ON upc.user_id = bl.buddy_id
    WHERE bl.user_id = p_user_id
    AND bl.status = 'accepted'
    ORDER BY bl.is_favorite DESC, bl.group_name, bl.buddy_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
