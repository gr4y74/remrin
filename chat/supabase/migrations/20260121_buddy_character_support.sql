-- Migration: Add Character Support to Buddy List
-- Enabling users to add AI characters as buddies

-- 1. Add columns to buddy_lists
ALTER TABLE public.buddy_lists 
ADD COLUMN IF NOT EXISTS buddy_type TEXT DEFAULT 'human' CHECK (buddy_type IN ('human', 'bot')),
ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE;

-- 2. Update get_buddies_with_status function to handle bots
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
            ELSE COALESCE(upc.status, 'offline') 
        END as status,
        upc.away_message,
        upc.last_seen,
        CASE
            WHEN bl.buddy_type = 'bot' THEN p.image_url
            ELSE upc.avatar_url
        END as avatar_url
    FROM public.buddy_lists bl
    LEFT JOIN public.user_profiles_chat upc ON upc.user_id = bl.buddy_id
    LEFT JOIN public.personas p ON p.id = bl.persona_id
    WHERE bl.user_id = p_user_id
    AND (bl.status = 'accepted' OR bl.buddy_type = 'bot')
    ORDER BY bl.is_favorite DESC, bl.group_name, bl.buddy_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
