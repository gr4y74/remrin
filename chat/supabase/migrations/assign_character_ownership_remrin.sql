-- ============================================
-- Assign All Characters to Remrin User
-- ============================================
-- This script assigns ownership of all personas/characters to the Remrin user

DO $$
DECLARE
    target_user_id TEXT := '5ee5ae79-01c9-4729-a99c-40dc68a51877';
BEGIN
    -- Update all personas to be owned by the target user
    UPDATE personas
    SET owner_id = target_user_id,
        updated_at = NOW()
    WHERE owner_id IS NULL OR owner_id != target_user_id;
    
    -- Print how many were updated
    RAISE NOTICE 'Updated % personas to be owned by user %', 
        (SELECT COUNT(*) FROM personas WHERE owner_id = target_user_id),
        target_user_id;
END $$;

-- Verify the update
SELECT 
    COUNT(*) as total_characters,
    owner_id,
    (SELECT username FROM profiles WHERE user_id = owner_id LIMIT 1) as owner_username
FROM personas
GROUP BY owner_id;
