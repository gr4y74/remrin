-- Populate Genesis Banner with Featured Characters
-- This adds the same characters shown on the home page carousel to the Genesis Banner gacha pool

-- First, ensure we have the personas (insert if they don't exist)
-- These are placeholder personas that will be created by admins/users
-- The actual persona data should already exist from previous seeds

-- Get the Genesis Banner pool ID
DO $$
DECLARE
    genesis_pool_id UUID;
    volt_id UUID;
    sui_id UUID;
    kess_id UUID;
    oma_id UUID;
    silas_id UUID;
    squee_id UUID;
BEGIN
    -- Get Genesis Banner pool
    SELECT id INTO genesis_pool_id 
    FROM gacha_pools 
    WHERE name = 'Genesis Banner' 
    LIMIT 1;

    -- If pool doesn't exist, create it
    IF genesis_pool_id IS NULL THEN
        INSERT INTO gacha_pools (name, description, is_active, cost_single, cost_ten)
        VALUES (
            'Genesis Banner',
            'The first banner of the multiverse. Pull legendary souls from across dimensions.',
            true,
            10,
            100
        )
        RETURNING id INTO genesis_pool_id;
        
        RAISE NOTICE 'Created Genesis Banner pool with ID: %', genesis_pool_id;
    END IF;

    -- Clear old demo items (if any)
    DELETE FROM gacha_pool_items WHERE pool_id = genesis_pool_id;

    -- Get persona IDs by name (these should exist in your database)
    -- If they don't exist, you'll need to create them first
    SELECT id INTO volt_id FROM personas WHERE name = 'Volt' LIMIT 1;
    SELECT id INTO sui_id FROM personas WHERE name = 'Sui' LIMIT 1;
    SELECT id INTO kess_id FROM personas WHERE name = 'Kess' LIMIT 1;
    SELECT id INTO oma_id FROM personas WHERE name = 'Oma' LIMIT 1;
    SELECT id INTO silas_id FROM personas WHERE name = 'Silas' LIMIT 1;
    SELECT id INTO squee_id FROM personas WHERE name = 'Squee' LIMIT 1;

    -- Add featured characters to Genesis Banner
    -- Volt - Legendary
    IF volt_id IS NOT NULL THEN
        INSERT INTO gacha_pool_items (pool_id, persona_id, rarity, weight, is_featured)
        VALUES (genesis_pool_id, volt_id, 'legendary', 50, true);
        RAISE NOTICE 'Added Volt (legendary) to Genesis Banner';
    ELSE
        RAISE WARNING 'Persona "Volt" not found. Skipping.';
    END IF;

    -- Sui - Epic
    IF sui_id IS NOT NULL THEN
        INSERT INTO gacha_pool_items (pool_id, persona_id, rarity, weight, is_featured)
        VALUES (genesis_pool_id, sui_id, 'epic', 150, true);
        RAISE NOTICE 'Added Sui (epic) to Genesis Banner';
    ELSE
        RAISE WARNING 'Persona "Sui" not found. Skipping.';
    END IF;

    -- Kess - Rare
    IF kess_id IS NOT NULL THEN
        INSERT INTO gacha_pool_items (pool_id, persona_id, rarity, weight, is_featured)
        VALUES (genesis_pool_id, kess_id, 'rare', 250, true);
        RAISE NOTICE 'Added Kess (rare) to Genesis Banner';
    ELSE
        RAISE WARNING 'Persona "Kess" not found. Skipping.';
    END IF;

    -- Oma - Rare  
    IF oma_id IS NOT NULL THEN
        INSERT INTO gacha_pool_items (pool_id, persona_id, rarity, weight, is_featured)
        VALUES (genesis_pool_id, oma_id, 'rare', 250, true);
        RAISE NOTICE 'Added Oma (rare) to Genesis Banner';
    ELSE
        RAISE WARNING 'Persona "Oma" not found. Skipping.';
    END IF;

    -- Silas - Common
    IF silas_id IS NOT NULL THEN
        INSERT INTO gacha_pool_items (pool_id, persona_id, rarity, weight, is_featured)
        VALUES (genesis_pool_id, silas_id, 'common', 350, true);
        RAISE NOTICE 'Added Silas (common) to Genesis Banner';
    ELSE
        RAISE WARNING 'Persona "Silas" not found. Skipping.';
    END IF;

    -- Squee - Common
    IF squee_id IS NOT NULL THEN
        INSERT INTO gacha_pool_items (pool_id, persona_id, rarity, weight, is_featured)
        VALUES (genesis_pool_id, squee_id, 'common', 350, true);
        RAISE NOTICE 'Added Squee (common) to Genesis Banner';
    ELSE
        RAISE WARNING 'Persona "Squee" not found. Skipping.';
    END IF;

    RAISE NOTICE 'Successfully populated Genesis Banner with featured characters';
END $$;

-- Verify the additions
SELECT 
    gp.name as pool_name,
    p.name as persona_name,
    gpi.rarity,
    gpi.weight,
    gpi.is_featured
FROM gacha_pool_items gpi
JOIN gacha_pools gp ON gpi.pool_id = gp.id
JOIN personas p ON gpi.persona_id = p.id
WHERE gp.name = 'Genesis Banner'
AND gpi.is_featured = true
ORDER BY 
    CASE gpi.rarity
        WHEN 'legendary' THEN 1
        WHEN 'epic' THEN 2
        WHEN 'rare' THEN 3
        WHEN 'common' THEN 4
    END,
    p.name;
