-- Auto-add Premium/Pro Personas to Gacha Pool
-- Created: 2026-01-01
-- Purpose: Automatically add personas created by premium users to the Community Souls gacha pool

-- ============================================
-- STEP 1: Ensure Community Pool Exists
-- ============================================

-- Create the Community Souls pool if it doesn't exist
DO $$
DECLARE
    community_pool_id UUID;
BEGIN
    -- Check if Community Souls pool exists
    SELECT id INTO community_pool_id 
    FROM gacha_pools 
    WHERE name = 'Community Souls' 
    LIMIT 1;
    
    -- Create it if it doesn't exist
    IF community_pool_id IS NULL THEN
        INSERT INTO gacha_pools (
            id,
            name,
            description,
            is_active,
            start_date,
            end_date
        ) VALUES (
            gen_random_uuid(),
            'Community Souls',
            'Discover rare souls crafted by our talented community of Soul Weavers, Architects, and Titans.',
            true,
            NULL,
            NULL
        );
        
        RAISE NOTICE 'Created Community Souls gacha pool';
    ELSE
        RAISE NOTICE 'Community Souls pool already exists with ID: %', community_pool_id;
    END IF;
END $$;

-- ============================================
-- STEP 2: Create Auto-Add Function
-- ============================================

CREATE OR REPLACE FUNCTION auto_add_premium_persona_to_pool()
RETURNS TRIGGER AS $$
DECLARE
    community_pool_id UUID;
    user_tier subscription_tier;
    persona_rarity TEXT;
    persona_weight INTEGER;
BEGIN
    -- Get the Community Souls pool ID
    SELECT id INTO community_pool_id 
    FROM gacha_pools 
    WHERE name = 'Community Souls' 
    AND is_active = true 
    LIMIT 1;
    
    -- If pool doesn't exist, skip
    IF community_pool_id IS NULL THEN
        RAISE WARNING 'Community Souls pool not found, skipping auto-add for persona %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Get user's subscription tier
    SELECT tier INTO user_tier
    FROM profiles
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    -- Only process for premium tiers (soul_weaver, architect, titan)
    IF user_tier IN ('soul_weaver', 'architect', 'titan') THEN
        -- Determine rarity and weight based on tier
        CASE user_tier
            WHEN 'titan' THEN
                persona_rarity := 'epic';
                persona_weight := 150;
            WHEN 'architect' THEN
                persona_rarity := 'rare';
                persona_weight := 125;
            WHEN 'soul_weaver' THEN
                persona_rarity := 'common';
                persona_weight := 100;
            ELSE
                -- Default fallback
                persona_rarity := 'common';
                persona_weight := 100;
        END CASE;
        
        -- Insert into gacha pool (skip if already exists)
        INSERT INTO gacha_pool_items (
            pool_id,
            persona_id,
            rarity,
            weight,
            is_featured
        ) VALUES (
            community_pool_id,
            NEW.id,
            persona_rarity,
            persona_weight,
            false
        )
        ON CONFLICT (pool_id, persona_id) DO NOTHING;
        
        RAISE NOTICE 'Added persona % to Community Souls pool with rarity % for % tier user',
            NEW.id, persona_rarity, user_tier;
    ELSE
        RAISE NOTICE 'Persona % created by % tier user, not adding to pool', 
            NEW.id, COALESCE(user_tier::text, 'wanderer');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Create Trigger
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_add_premium_persona ON personas;

-- Create new trigger
CREATE TRIGGER trigger_auto_add_premium_persona
    AFTER INSERT ON personas
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_premium_persona_to_pool();

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify trigger was created
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'trigger_auto_add_premium_persona';
    
    IF trigger_count > 0 THEN
        RAISE NOTICE '✅ Trigger created successfully';
    ELSE
        RAISE WARNING '❌ Trigger was not created';
    END IF;
END $$;

-- Verify Community Pool exists
DO $$
DECLARE
    pool_count INTEGER;
    pool_item_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pool_count
    FROM gacha_pools
    WHERE name = 'Community Souls' AND is_active = true;
    
    SELECT COUNT(*) INTO pool_item_count
    FROM gacha_pool_items gpi
    JOIN gacha_pools gp ON gpi.pool_id = gp.id
    WHERE gp.name = 'Community Souls';
    
    RAISE NOTICE '✅ Community Souls pool exists: %', (pool_count > 0);
    RAISE NOTICE '📊 Current items in Community Souls pool: %', pool_item_count;
END $$;

COMMENT ON FUNCTION auto_add_premium_persona_to_pool() IS 
'Automatically adds newly created personas from premium users (soul_weaver, architect, titan) to the Community Souls gacha pool with tier-appropriate rarity';

COMMENT ON TRIGGER trigger_auto_add_premium_persona ON personas IS
'Triggers after persona insert to automatically add premium user personas to gacha pool';
