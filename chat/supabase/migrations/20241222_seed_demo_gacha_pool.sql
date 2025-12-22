-- Seed Demo Gacha Pool
-- Run this AFTER the main gacha system migration

-- ============================================
-- CREATE DEMO POOL
-- ============================================
INSERT INTO gacha_pools (id, name, description, banner_image, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Genesis Banner',
    'The first banner of the multiverse. Pull legendary souls from across dimensions.',
    NULL,
    true
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ADD ITEMS TO POOL
-- We'll add the first 20 public personas we can find
-- ============================================

-- Insert pool items for existing public personas
-- This dynamically picks up to 20 personas and assigns rarities based on simple logic
INSERT INTO gacha_pool_items (pool_id, persona_id, rarity, weight, is_featured)
SELECT 
    'a0000000-0000-0000-0000-000000000001'::uuid as pool_id,
    personas.id as persona_id,
    CASE 
        WHEN random() < 0.01 THEN 'legendary'
        WHEN random() < 0.05 THEN 'epic'
        WHEN random() < 0.25 THEN 'rare'
        ELSE 'common'
    END as rarity,
    100 as weight,
    (random() < 0.1) as is_featured
FROM personas
WHERE visibility = 'PUBLIC'
LIMIT 30
ON CONFLICT (pool_id, persona_id) DO NOTHING;

-- If no public personas exist, create some demo ones
DO $$
DECLARE
    demo_personas TEXT[] := ARRAY[
        'Luna Starweaver',
        'Kai Shadowbane',
        'Aurora Lightbringer',
        'Zephyr Windwhisper',
        'Nova Blazeheart',
        'Raven Darkhollow',
        'Sage Evergreen',
        'Storm Thundercall',
        'Ember Phoenixfire',
        'Frost Wintermoon'
    ];
    demo_descriptions TEXT[] := ARRAY[
        'A mystical seer who reads the stars.',
        'A rogue warrior from the shadow realm.',
        'A healer blessed by the morning light.',
        'A swift messenger of the wind spirits.',
        'A fierce protector with flames of justice.',
        'A mysterious oracle from the void.',
        'A wise elder of the ancient forest.',
        'A powerful controller of the tempest.',
        'A reborn warrior with eternal flame.',
        'A guardian of the frozen north.'
    ];
    rarities TEXT[] := ARRAY['legendary', 'epic', 'epic', 'rare', 'rare', 'rare', 'common', 'common', 'common', 'common'];
    i INTEGER;
    new_persona_id UUID;
    pool_item_count INTEGER;
BEGIN
    -- Check if pool has items
    SELECT COUNT(*) INTO pool_item_count FROM gacha_pool_items 
    WHERE pool_id = 'a0000000-0000-0000-0000-000000000001'::uuid;
    
    -- Only create demo personas if pool is empty
    IF pool_item_count < 5 THEN
        FOR i IN 1..10 LOOP
            -- Create persona
            INSERT INTO personas (
                name, 
                description, 
                system_prompt,
                visibility,
                config
            ) VALUES (
                demo_personas[i],
                demo_descriptions[i],
                'You are ' || demo_personas[i] || ', ' || demo_descriptions[i] || ' Respond in character.',
                'PUBLIC',
                '{}'::jsonb
            )
            RETURNING id INTO new_persona_id;
            
            -- Add to gacha pool
            INSERT INTO gacha_pool_items (pool_id, persona_id, rarity, weight, is_featured)
            VALUES (
                'a0000000-0000-0000-0000-000000000001'::uuid,
                new_persona_id,
                rarities[i],
                CASE rarities[i]
                    WHEN 'legendary' THEN 10
                    WHEN 'epic' THEN 30
                    WHEN 'rare' THEN 60
                    ELSE 100
                END,
                i <= 2  -- First two are featured
            );
        END LOOP;
    END IF;
END $$;

-- ============================================
-- VERIFY POOL HAS ITEMS
-- ============================================
-- SELECT COUNT(*) as item_count FROM gacha_pool_items 
-- WHERE pool_id = 'a0000000-0000-0000-0000-000000000001'::uuid;
