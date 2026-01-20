-- Migration for real-time features: Read receipts and Last Seen

-- 1. Update direct_messages table
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 2. Update user_profiles_chat table
ALTER TABLE public.user_profiles_chat 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Create function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_direct_messages_as_read(target_user_id UUID, from_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.direct_messages
    SET read_at = NOW(), read = true
    WHERE to_user_id = target_user_id 
    AND from_user_id = from_user_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to mark messages as delivered
CREATE OR REPLACE FUNCTION public.mark_direct_messages_as_delivered(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.direct_messages
    SET delivered_at = NOW()
    WHERE to_user_id = target_user_id 
    AND delivered_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enable Realtime for direct_messages (ensure it's updated)
-- We already have ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages; in a previous migration.
-- But we might need to ensure 'UPDATE' events are tracked if they weren't before (though by default they are).
