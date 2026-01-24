-- ============================================================================
-- REMRIN MESSENGER - POPULATE WITH SAMPLE DATA
-- Migration: 20260122_populate_sample_data
-- Purpose: Add sample buddy for testing (adds your own account as a test buddy)
-- ============================================================================

-- This migration adds a simple test buddy so you can see the messenger UI working
-- It adds your own account as a buddy so you can test the chat interface

DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get the current user (sosu.remrin@gmail.com)
  SELECT id, email INTO v_user_id, v_user_email
  FROM auth.users
  WHERE email = 'sosu.remrin@gmail.com'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Add yourself as a test buddy (for testing the UI)
    INSERT INTO public.buddy_lists (
      user_id,
      buddy_id,
      buddy_username,
      buddy_type,
      group_name,
      status
    )
    VALUES (
      v_user_id,
      v_user_id, -- Adding yourself as buddy for testing
      'sosu (Test)',
      'human',
      'Test Buddies',
      'accepted'
    )
    ON CONFLICT (user_id, buddy_id) DO NOTHING;

    RAISE NOTICE 'Added test buddy for user %', v_user_email;
    
    -- Add a welcome message from "yourself" to test the chat
    INSERT INTO public.direct_messages (
      from_user_id,
      to_user_id,
      from_username,
      to_username,
      message,
      created_at
    )
    VALUES
      (v_user_id, v_user_id, 'sosu (Test)', 'sosu', '👋 Welcome to Remrin Messenger! This is a test message to show how the chat works.', NOW() - INTERVAL '1 hour'),
      (v_user_id, v_user_id, 'sosu (Test)', 'sosu', 'Try typing a message below to test the draft persistence feature!', NOW() - INTERVAL '30 minutes')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Added test messages for user %', v_user_email;
  ELSE
    RAISE NOTICE 'User sosu.remrin@gmail.com not found';
  END IF;
END $$;

-- ============================================================================
-- NOTES:
-- This is just for testing the UI. To add real buddies:
-- 1. Go to the main Remrin site and follow users/personas
-- 2. The follow→buddy sync will automatically populate your messenger
-- 3. Or use the "Discover" tab in the messenger to find and add buddies
-- ============================================================================
