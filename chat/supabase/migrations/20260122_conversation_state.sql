-- ============================================================================
-- REMRIN MESSENGER - PHASE 4: CONVERSATION CONTINUITY
-- Migration: 20260122_conversation_state
-- Purpose: Enable seamless conversation continuity across devices and sessions
-- ============================================================================

-- 1. Create conversation_state table
CREATE TABLE IF NOT EXISTS public.conversation_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL, -- buddy_id or room_id
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('direct', 'room')),
  
  -- State data
  last_read_message_id UUID,
  last_read_at TIMESTAMP WITH TIME ZONE,
  draft_message TEXT,
  scroll_position INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Metadata
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, conversation_id, conversation_type)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_state_user 
ON public.conversation_state(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_state_activity 
ON public.conversation_state(user_id, last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_state_pinned 
ON public.conversation_state(user_id, is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_conversation_state_archived 
ON public.conversation_state(user_id, is_archived) WHERE is_archived = true;

-- 3. Enable RLS
ALTER TABLE public.conversation_state ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own conversation state"
  ON public.conversation_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation state"
  ON public.conversation_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation state"
  ON public.conversation_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation state"
  ON public.conversation_state FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Add read tracking to direct_messages
ALTER TABLE public.direct_messages 
ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- 6. Create index for read tracking
CREATE INDEX IF NOT EXISTS idx_direct_messages_read_by 
ON public.direct_messages USING GIN(read_by);

-- 7. Function to mark message as read
CREATE OR REPLACE FUNCTION public.mark_message_read(
  p_message_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_conversation_id UUID;
  v_from_user_id UUID;
  v_to_user_id UUID;
BEGIN
  -- Get message details
  SELECT from_user_id, to_user_id
  INTO v_from_user_id, v_to_user_id
  FROM public.direct_messages
  WHERE id = p_message_id;

  -- Determine conversation partner
  IF v_from_user_id = p_user_id THEN
    v_conversation_id := v_to_user_id;
  ELSE
    v_conversation_id := v_from_user_id;
  END IF;

  -- Update read_by array if not already read
  UPDATE public.direct_messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE id = p_message_id
  AND NOT (p_user_id = ANY(read_by));
  
  -- Update conversation state
  INSERT INTO public.conversation_state (
    user_id,
    conversation_id,
    conversation_type,
    last_read_message_id,
    last_read_at,
    last_activity_at,
    updated_at
  )
  VALUES (
    p_user_id,
    v_conversation_id,
    'direct',
    p_message_id,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, conversation_id, conversation_type)
  DO UPDATE SET
    last_read_message_id = p_message_id,
    last_read_at = NOW(),
    last_activity_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_count(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN dm.from_user_id = p_user_id THEN dm.to_user_id
      ELSE dm.from_user_id
    END as conversation_id,
    COUNT(*) as unread_count
  FROM public.direct_messages dm
  WHERE (dm.to_user_id = p_user_id OR dm.from_user_id = p_user_id)
  AND NOT (p_user_id = ANY(dm.read_by))
  AND dm.to_user_id = p_user_id -- Only count messages TO the user
  GROUP BY conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_state_timestamp 
ON public.conversation_state;

CREATE TRIGGER trigger_update_conversation_state_timestamp
BEFORE UPDATE ON public.conversation_state
FOR EACH ROW
EXECUTE FUNCTION update_conversation_state_timestamp();

-- 10. Enable real-time for conversation_state
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_state;

-- 11. Add comments for documentation
COMMENT ON TABLE public.conversation_state IS 
'Stores conversation state per user including draft messages, scroll position, and read status for seamless multi-device experience';

COMMENT ON FUNCTION public.mark_message_read IS 
'Marks a message as read by a user and updates conversation state';

COMMENT ON FUNCTION public.get_unread_count IS 
'Returns unread message count per conversation for a user';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
