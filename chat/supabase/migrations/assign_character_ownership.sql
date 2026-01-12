-- ============================================
-- Assign All Characters to Current User
-- ============================================
-- This script will assign ownership of all personas/characters to a specific user
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID

-- First, find your user ID by running:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then update this variable with your user ID:
DO $$
DECLARE
    target_user_id UUID := 'YOUR_USER_ID_HERE'; -- REPLACE THIS WITH YOUR USER ID
BEGIN
    -- Update all personas to be owned by the target user
    UPDATE personas
    SET owner_id = target_user_id,
        updated_at = NOW()
    WHERE owner_id IS NULL OR owner_id != target_user_id;
    
    -- Print how many were updated
    RAISE NOTICE 'Updated % personas', (SELECT COUNT(*) FROM personas WHERE owner_id = target_user_id);
END $$;

-- Verify the update
SELECT 
    COUNT(*) as total_characters,
    owner_id
FROM personas
GROUP BY owner_id;
